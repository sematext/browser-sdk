/* @flow */
import {
  toAbsoluteUrl,
  toUrlInfo,
  getTime,
  logDebug,
  getDefaultMeta,
  getCompressedResources,
} from '../common';
import { removeAjaxListener, registerAjaxListener } from '../ajax';
import { lockPerformanceBuffer, unlockPerformanceBuffer } from '../buffer';
import type { AjaxListener } from '../ajax';
import type { CommandContext, ElementTiming, LongTask, PageLoadMetrics } from './types';
import LongTaskObserver from '../longtask/LongTaskObserver';
import PageLoadElementTimingObserver from '../element/PageElementTimingObserver';
import { getAdjustedElementTimings } from '../element/utils';
import { getAdjustedLongTasks } from '../longtask/utils';

/**
 * Time to wait for any activity after SPA navigation event.
 *
 * If this timer runs out before any network activity was detected the
 * navigation event will be dropped.
 */
const ACTIVITY_TIMEOUT = 4000;

class RouteChangeObserver {
  cb: (metrics: any, longTasks: Array<LongTask>, elementTimings: Array<ElementTiming>) => void;

  mutationObserver: MutationObserver;

  longTaskObserver: LongTaskObserver;

  elementTimingObserver: PageLoadElementTimingObserver;

  interesting = false;

  resources: [];

  urls = {};

  pendingEvents = 0;

  url: string;

  startedAt: number;
  finishedAt: ?number;

  /**
   * Offset of this soft page navigation from initial hard navigation start.
   */
  startedOffset: number;

  timer: ?TimeoutID;

  canceled = false;

  context: CommandContext;

  lockId: string;

  constructor(
    context: CommandContext,
    url: string,
    navigationStart: number,
    callback: (metrics: any, longTasks: Array<LongTask>,
               elementTimings: Array<ElementTiming>) => void,
  ) {
    logDebug('Route change observed');
    this.cb = callback;
    this.url = url;
    this.startedAt = getTime();
    logDebug(this.startedAt, navigationStart);
    this.startedOffset = this.startedAt - navigationStart;
    this.context = context;

    this.setupDomObserver();
    this.setupAjaxObserver();
    this.setupIdlingObserver();
    this.setTimeout(ACTIVITY_TIMEOUT);
    this.lockId = lockPerformanceBuffer();
  }

  setupIdlingObserver() {
    if ('requestIdleCallback' in window) {
      // Wait at most two seconds before processing events.
      requestIdleCallback((deadline) => {
        logDebug(
          `Idle time after route changed, change ${deadline.didTimeout ? 'was' : 'was not'} interesting.`,
          'Estimated remaining idling', deadline.timeRemaining(),
        );
      }, { timeout: 100 });
    }
  }

  setupDomObserver() {
    this.mutationObserver = new MutationObserver(this.mutation);
    this.mutationObserver.observe(window.document, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    this.longTaskObserver = new LongTaskObserver((list: PerformanceObserverEntryList) => {
      if (list && list.getEntries() && list.getEntries().length) {
        if (this.canceled) {
          return;
        }

        logDebug('Long Task detected for route change');
        this.interesting = true;
        this.pendingEvents += 1;

        this.onEventFinished();
      }
    });
    this.elementTimingObserver = new PageLoadElementTimingObserver();
  }

  setupAjaxObserver() {
    registerAjaxListener(this.createAjaxListener);
  }

  createAjaxListener = (url: string): AjaxListener => ({
    onSend: () => {
      if (this.canceled) {
        return;
      }

      this.urls[url] = 1;
      this.interesting = true;
      this.pendingEvents += 1;

      // clear timeout since we have found at least one interesting event (ajax request)
      logDebug('Tracking ajax request for route change', url);
      this.clearTimeout();
    },

    onLoadEnd: () => {
      if (this.canceled) {
        return;
      }

      this.onEventFinished();
    },
  });

  setTimeout(timeout: number) {
    logDebug('Setting timeout to', timeout);
    this.clearTimeout();
    this.timer = setTimeout(this.activityTimeout, timeout);
  }

  clearTimeout() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Called after the initial activity timeout.
   *
   * If there was no interesting activity during this period we will drop this
   * route change event.
   */
  activityTimeout = () => {
    logDebug('Activity timeout reached', this.interesting);
    if (this.interesting) {
      this.finish();
    } else {
      this.cancel();
    }
  };

  /**
   * When mutation occurs in DOM we want to wait for any interesting resources to be loaded.
   * For example, if an image or iframe were added to the DOM we want to wait
   * for them to finish loading.
   */
  mutation = (mutations: Array<MutationRecord>) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        this.waitForNode(mutation.target);
      } else if (mutation.type === 'childList') {
        let len = mutation.addedNodes.length;
        let i = 0;
        for (i = 0; i < len; i += 1) {
          this.interesting = this.waitForNode(mutation.addedNodes[i]) || this.interesting;
        }

        len = mutation.removedNodes.length;
        for (i = 0; i < len; i += 1) {
          const node: any = mutation.removedNodes[i];

          // When iframe is removed the onload event is not going to be triggered so we remove it
          if (node.nodeName === 'IFRAME' && node._sce && !this.canceled) {
            this.onNodeLoaded({ node, type: 'removed' });
          }
        }
      }
    });
  };

  /**
   * Some nodes such as img, iframe, and link can cause additional resources to
   * be downloaded. We consider these critical resources and will wait for them
   * to download to consider the navigation event complete.
   *
   * We use some additional heuristics to determine if we should wait for the node:
   *  a) don't wait if there is no url or if javascript:, about:, or data: is used
   *  b) don't wait if the image is already loaded (cache?) or if there is no src
   *  c) don't wait if the image is too small (tracking pixels)
   *  d) don't wait for elements that are hidden (display: none, visibility: none)
   */
  waitForNode(node: any) {
    let interesting = false;
    const isResourceNode = node && node.nodeName &&
      (node.nodeName.match(/^(IMG|IFRAME|IMAGE)/i) ||
      (node.nodeName.toUpperCase() === 'LINK' && (node.getAttribute('rel') || '').trim().toUpperCase() === 'STYLESHEET'));

    if (isResourceNode) {
      const url = node.getAttribute('src') || node.getAttribute('xlink:href') || node.getAttribute('href');

      // todo: handle attribute changes

      // no network activity
      if (!url || url.match(/^(about:|javascript:|data:)/i)) {
        return false;
      }

      // image already loaded so no network activity
      if (node.nodeName === 'IMG' && node.naturalWidth) {
        return false;
      }

      // check if node is too small to be of any importance for navigation event
      const { width, height } = this.getNodeDimensions(node);
      if (width !== undefined && width < 1 && height !== undefined && height < 1) {
        return false;
      }

      // if element is not displayed / hidden we don't care about it
      if (node.style && node.style.display === 'none') {
        return false;
      }

      if (node.style && node.style.visibility === 'hidden') {
        return false;
      }

      // we have already seen this url
      if (this.urls[url]) {
        return false;
      }

      // if we got this far this event needs to be tracked for completion and
      // we consider it blocking in the context of this route navigation event
      logDebug('Found interesting node', url, node.nodeName);
      interesting = true;

      if (!node._sce) {
        node._sce = {
          url,
        };
      }

      const listener = (e) => {
        if (!this.canceled) {
          this.onNodeLoaded(e);
        }
        node.removeEventListener('load', listener);
        node.removeEventListener('error', listener);
      };
      node.addEventListener('load', listener);
      node.addEventListener('error', listener);


      this.urls[url] = 1;
      this.pendingEvents += 1;

      // we found at least one interesting node, so no point in waiting for activity timeout
      this.clearTimeout();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // element nodes can contain images so we need to look for those
      ['IMAGE', 'IMG'].forEach((tagName) => {
        const images = node.getElementsByTagName(tagName);
        if (images && images.length) {
          const len = images.length;
          let i = 0;
          for (i = 0; i < len; i += 1) {
            interesting = this.waitForNode(images[i]) || interesting;
          }
        }
      });
    }

    return interesting;
  }

  onNodeLoaded(e: any) {
    const target = e.target || e.srcElement;
    const now = getTime();

    if (!target || !target._sce) {
      return;
    }

    // check if we have already handled this node being loaded
    // images that result in 404 for example can call both error and load callbacks
    if (target._sce.end) {
      return;
    }

    target._sce.end = now;

    this.onEventFinished();
  }

  onEventFinished() {
    this.pendingEvents -= 1;
    logDebug('Tracked event finished', this.pendingEvents);
    if (this.pendingEvents === 0) {
      if (!this.finishedAt) {
        // wait for any additional activity for a little longer, and note that
        // we only do this once
        this.finishedAt = getTime();
        this.setTimeout(ACTIVITY_TIMEOUT);
      } else {
        this.finishedAt = getTime();
        this.finish();
      }
    }
  }

  getNodeDimensions(node: any) {
    const smallValues = ['0', '0px', '1px'];
    let height = parseInt(node.getAttribute('height'), 10);
    let width = parseInt(node.getAttribute('width'), 10);

    if (Number.isNaN(height)) {
      height = (node.style && smallValues.includes(node.style.height)) ? 0 : undefined;
    }

    if (Number.isNaN(width)) {
      width = (node.style && smallValues.includes(node.style.width)) ? 0 : undefined;
    }

    return { width, height };
  }

  cancel() {
    this.mutationObserver.disconnect();
    if (this.longTaskObserver) {
      this.longTaskObserver.stop();
    }
    if (this.elementTimingObserver) {
      this.elementTimingObserver.stop();
    }
    removeAjaxListener(this.createAjaxListener);
    this.canceled = true;
    unlockPerformanceBuffer(this.lockId);
  }

  finish() {
    const {
      url,
      startedAt,
      finishedAt,
      startedOffset,
    } = this;

    if (!finishedAt) {
      return;
    }

    // store the tasks
    let longTasks = [];
    if (this.longTaskObserver) {
      longTasks = getAdjustedLongTasks(this.longTaskObserver.getTasks(), startedOffset);
    }

    // store element timing
    let elementTimings = [];
    if (this.elementTimingObserver) {
      // We need to adjust the time of the timing elements
      // according to startedOffset of the soft page load.
      elementTimings = getAdjustedElementTimings(
        this.elementTimingObserver.getTimingElements(),
        startedOffset,
      );
    }

    this.cancel();

    // get all resources downloaded in the meantime
    const resources = getCompressedResources(
      window,
      this.startedAt,
      this.finishedAt,
      this.context && this.context.config && this.context.config.resolveUrl,
    );

    const pageLoad: PageLoadMetrics = {
      '@timestamp': new Date(startedAt).toISOString(),
      initiator: 'routechange',
      url: toUrlInfo(toAbsoluteUrl(url)),
      meta: getDefaultMeta(this.context),
      resources,
      navigationStart: startedAt,
      fetchStart: startedAt,
      domContentLoadedEventEnd: finishedAt,
      loadEventEnd: finishedAt,
      startedOffset,
    };

    this.cb(pageLoad, longTasks, elementTimings);
  }
}

export default RouteChangeObserver;

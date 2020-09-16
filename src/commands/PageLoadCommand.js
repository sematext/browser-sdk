/* @flow */
import type { PageLoadMetrics, Command, CommandContext } from './types';
import { uuid4, getCompressedResources, toUrlInfo, getDefaultMeta, logDebug } from '../common';
import { getAdjustedElementTimings } from '../element/utils';
import { getAdjustedLongTasks } from '../longtask/utils';

function nextPageLoadUuid() {
  const initialUuid = uuid4();

  // We use Long on backend for uuids, therefore we need to get only 64 bits of randomness
  const part = initialUuid.substring(initialUuid.length - 8);
  return parseInt(part.split('').map(c => c.charCodeAt(0).toString(2)).join(''), 2).toString();
}

let pageLoadUuid = nextPageLoadUuid();
let firstPageLoad = true;

export function getPageLoadUuid() {
  return pageLoadUuid;
}


class PageLoadCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  supported() {
    const { scope } = this.context;
    return scope.performance && scope.performance.timing;
  }

  collectResourcesMetrics() {
    return getCompressedResources(window, null, null, this.context &&
        this.context.config && this.context.config.resolveUrl);
  }

  collectMetrics(): ?Object {
    if (!this.supported()) {
      return null;
    }

    const { scope, config } = this.context;
    const { timing } = scope.performance;

    const paintResult = {};
    try {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((performanceEntry) => {
        paintResult[performanceEntry.name] = performanceEntry.startTime;
      });
    } catch (e) {
      logDebug(e);
    }

    const {
      navigationStart,
      unloadEventStart,
      unloadEventEnd,
      redirectStart,
      redirectEnd,
      fetchStart,
      domainLookupStart,
      domainLookupEnd,
      connectStart,
      connectEnd,
      secureConnectionStart,
      requestStart,
      responseStart,
      responseEnd,
      domLoading,
      domInteractive,
      domContentLoadedEventStart,
      domContentLoadedEventEnd,
      domComplete,
      loadEventStart,
      loadEventEnd,
    } = timing;

    const timestamp = new Date(navigationStart);
    const resolveUrl = config && config.resolveUrl;

    if (!firstPageLoad) {
      pageLoadUuid = nextPageLoadUuid();
    }

    const metrics: PageLoadMetrics = {
      initiator: 'pageload',
      navigationStart,
      unloadEventStart,
      unloadEventEnd,
      redirectStart,
      redirectEnd,
      fetchStart,
      domainLookupStart,
      domainLookupEnd,
      connectStart,
      connectEnd,
      secureConnectionStart,
      requestStart,
      responseStart,
      responseEnd,
      domLoading,
      domInteractive,
      domContentLoadedEventStart,
      domContentLoadedEventEnd,
      domComplete,
      loadEventStart,
      loadEventEnd,
      url: toUrlInfo(window.location, resolveUrl),
      meta: getDefaultMeta(this.context),
      resources: this.collectResourcesMetrics(),
      firstPaint: paintResult['first-paint'],
      firstContentfulPaint: paintResult['first-contentful-paint'],
      '@timestamp': timestamp.toISOString(),
      uuid: pageLoadUuid,
    };

    return metrics;
  }

  // eslint-disable-next-line
  execute(args: Array<any>) {
    // args may contain metrics, i.e. during route change
    if (args !== undefined && args.length > 0) {
      // eslint-disable-next-line prefer-const
      let { metrics, longTasks, elementTimings } = args[0] || {};
      if (metrics === undefined || metrics === null || Object.keys(metrics).length === 0) {
        metrics = this.collectMetrics();
      }

      const { uploader } = this.context;
      if (metrics && uploader) {
        metrics.longTask = getAdjustedLongTasks(longTasks, 0);
        metrics.elementTiming = getAdjustedElementTimings(elementTimings, 0);
        uploader.enqueue(metrics, 'pageLoad');
        uploader.sendBatch();
        firstPageLoad = false;
      }
    } else {
      logDebug('No arguments for pageLoad');
    }
  }
}

export default PageLoadCommand;

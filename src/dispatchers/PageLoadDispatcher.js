/* @flow */
import type { Dispatcher } from './types';
import CommandExecutor from '../CommandExecutor';
import { logDebug } from '../common';
import RouteChangeObserver from '../commands/RouteChangeObserver';
import type { CommandContext } from '../commands';
import { registerRouteChangeListener, removeRouteChangeListener } from '../pageload';
import { longTaskSupported, getGlobalLongTasks, cleanGlobalLongTasks } from '../longtask/utils';
import {
  cleanGlobalElementTiming,
  elementTimingSupported,
  getGlobalElementTiming,
  setElementTimingInPageLoad,
  setElementTimingOutsidePageLoad,
  disconnectGlobalObserver,
} from '../element/utils';
import { PAGELOAD_HARD_TIMEOUT, PAGELOAD_SOFT_TIMEOUT } from '../constants';

class PageLoadDispatcher implements Dispatcher {
  executors: Array<CommandExecutor>;
  currentRouteChange: ?RouteChangeObserver;
  started: boolean;

  constructor() {
    this.executors = [];
    this.started = false;
  }

  addExecutor(executor: CommandExecutor) {
    this.executors.push(executor);
  }

  isRefreshed() {
    if (window.performance) {
      return window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD;
    }
    return false;
  }

  onRouteChange = (pathname: string, context: CommandContext) => {
    if (this.currentRouteChange) {
      this.currentRouteChange.cancel();
    }

    const { scope, name } = context;
    const { navigationStart } = scope.performance.timing;

    setElementTimingInPageLoad(name);
    this.currentRouteChange = new RouteChangeObserver(
      context,
      pathname,
      navigationStart,
      (metrics, longTasks, elementTimings) => {
        // delay metric collection so that loadEventEnd is not 0
        setTimeout(() => {
          this.executors.forEach((e) => {
            e.execute('pageLoad', { metrics, longTasks, elementTimings });
            setElementTimingOutsidePageLoad(e.contextName);
          });
        }, PAGELOAD_SOFT_TIMEOUT);
      },
    );
  };

  start() {
    if (!this.started) {
      this.started = true;

      if (!this.isRefreshed()) {
        window.addEventListener('load', this.handleLoad);
      } else {
        logDebug('Page was refreshed, not adding load handler');
      }

      registerRouteChangeListener(this);

      logDebug('PageLoadDispatcher started');
    }
  }

  pause() {
    if (this.started) {
      this.started = false;

      window.removeEventListener('load', this.handleLoad);
      removeRouteChangeListener(this);

      if (this.currentRouteChange) {
        this.currentRouteChange.cancel();
      }

      logDebug('PageLoadDispatcher paused');
    }
  }

  getLongTasks(contextName: string) {
    let longTasks = [];
    if (longTaskSupported()) {
      longTasks = getGlobalLongTasks(contextName);
      if (longTasks.length > 0) {
        cleanGlobalLongTasks(contextName);
      }
    }
    return longTasks;
  }

  getTimingElements(contextName: string) {
    let timingElements = [];
    if (elementTimingSupported()) {
      timingElements = getGlobalElementTiming(contextName);
      if (timingElements.length > 0) {
        cleanGlobalElementTiming(contextName);
      }
    }
    return timingElements;
  }

  handleLoad = () => {
    // delay metric collection so that loadEventEnd is not 0
    setTimeout(() => {
      this.executors.forEach((e) => {
        e.execute(
          'pageLoad',
          {
            longTasks: this.getLongTasks(e.contextName),
            elementTimings: this.getTimingElements(e.contextName),
          },
        );
        setElementTimingOutsidePageLoad(e.contextName);
        // we can disconnect the global observer now
        disconnectGlobalObserver(e.contextName);
      });
    }, PAGELOAD_HARD_TIMEOUT);
  };
}

export default PageLoadDispatcher;

/* @flow */
import type { Dispatcher } from './types';
import CommandExecutor from '../CommandExecutor';
import { logDebug } from '../common';
import { elementTimingSupported, isElementTimingInPageLoad } from '../element/utils';

class ElementTimingDispatcher implements Dispatcher {
  executors: Array<CommandExecutor>;
  started: boolean;
  observer: PerformanceObserver;

  constructor() {
    this.executors = [];
    this.started = false;
  }

  addExecutor(executor: CommandExecutor) {
    this.executors.push(executor);
  }

  supported() {
    return elementTimingSupported();
  }

  start() {
    if (!this.supported()) {
      logDebug('Element Timing API is not supported, skipping ElementTimingDispatcher');
    }

    if (!this.started) {
      this.started = true;

      try {
        this.observer = new PerformanceObserver(this.handleObserve);
        this.observer.observe({ type: 'element' });
        logDebug('ElementTimingDispatcher started');
      } catch (ex) {
        this.started = false;
        logDebug('Error starting ElementTimingDispatcher');
      }
    }
  }

  pause() {
    if (this.started) {
      this.started = false;
      this.observer.disconnect();

      logDebug('ElementTimingDispatcher paused');
    }
  }

  handleObserve = (list: PerformanceObserverEntryList) => {
    if (this.started) {
      const entries = list.getEntries();
      this.executors.forEach((e) => {
        if (!isElementTimingInPageLoad(e.contextName)) {
          if (entries && entries.length > 0) {
            entries.forEach((entry => e.execute('elementTiming', entry)));
          }
        } else {
          logDebug('Not sending timing from ElementTimingDispatcher because of being part page load');
        }
      });
    }
  };
}

export default ElementTimingDispatcher;

/* @flow */
import type { Dispatcher } from './types';
import CommandExecutor from '../CommandExecutor';
import { logDebug } from '../common';

export const measureSupported = (): boolean => {
  if (window.PerformanceObserver && window.PerformanceObserver.supportedEntryTypes &&
    PerformanceObserver.supportedEntryTypes.indexOf('measure') >= 0) {
    return true;
  }
  return false;
};

class MeasureDispatcher implements Dispatcher {
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
    return measureSupported();
  }

  start() {
    if (!this.supported()) {
      logDebug('performance.measure() API is not supported, skipping MeasureDispatcher');
    }

    if (!this.started) {
      this.started = true;

      try {
        this.observer = new PerformanceObserver(this.handleObserve);
        this.observer.observe({ entryTypes: ['measure'] });
        logDebug('MeasureDispatcher started');
      } catch (ex) {
        this.started = false;
        logDebug('Error starting MeasureDispatcher');
      }
    }
  }

  pause() {
    if (this.started) {
      this.started = false;
      this.observer.disconnect();

      logDebug('MeasureDispatcher paused');
    }
  }

  handleObserve = (list: PerformanceObserverEntryList) => {
    if (this.started) {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const { name, startTime, duration } = entry;
        console.log(entry);
        this.executors.forEach(e => e.execute('recordTransaction', name, startTime, duration));
      });
    }
  }
}

export default MeasureDispatcher;

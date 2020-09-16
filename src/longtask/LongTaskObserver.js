/* @flow */

import { logDebug } from '../common';
import { longTaskSupported } from './utils';

class LongTaskObserver {
  observer: PerformanceObserver;
  longTasks: Array<PerformanceEntry>;
  started: boolean;

  constructor(observer: Object) {
    this.longTasks = [];
    this.started = false;
    this.start(observer);
  }

  start(observer: Object) {
    if (!longTaskSupported()) {
      return;
    }

    if (!this.started) {
      try {
        this.started = true;
        this.observer = new PerformanceObserver(this.handleObserve(observer));
        this.observer.observe({ entryTypes: ['longtask'] });
        logDebug('LongTaskObserver started');
      } catch (ex) {
        this.started = false;
        logDebug('Error during LongTaskObserver start');
      }
    }
  }

  pause() {
    this.stop();
  }

  stop() {
    if (this.started) {
      logDebug('Stopping LongTaskObserver');
      this.observer.disconnect();
      this.clearTasks();
      this.started = false;
    }
  }

  clearTasks() {
    logDebug('Clearing long tasks array');
    this.longTasks = [];
  }

  getTasks(): Array<PerformanceEntry> {
    if (!longTaskSupported()) {
      return [];
    }

    if (this.longTasks.length > 0) {
      const returnArray = [];
      while (this.longTasks.length > 0) {
        returnArray.push(this.longTasks.pop());
      }
      return returnArray;
    }

    // it may happen that the record is there, but not yet visible
    // we need to force-load it and return it
    return this.observer.takeRecords();
  }

  handleObserve = (observer: Object) => (list: PerformanceObserverEntryList) => {
    list.getEntries().forEach(entry => this.longTasks.push(entry));
    observer(list);
  }
}

export default LongTaskObserver;

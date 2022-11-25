/* @flow */

import type { ElementTimingObserver } from '../types';
import { logDebug } from '../common';
import { elementTimingSupported } from './utils';

class PageLoadElementTimingObserver implements ElementTimingObserver {
  observer: PerformanceObserver;
  timingElements: Array<PerformanceEntry>;
  started: boolean;

  constructor() {
    this.timingElements = [];
    this.started = false;
    this.start();
  }

  start() {
    if (!elementTimingSupported()) {
      return;
    }

    if (!this.started) {
      try {
        this.started = true;
        this.observer = new PerformanceObserver(this.handleObserve);
        this.observer.observe({ entryTypes: ['element'] });
        logDebug('PageLoadElementTimingObserver started');
      } catch (ex) {
        this.started = false;
        logDebug('Error during PageLoadElementTimingObserver start');
      }
    }
  }

  pause() {
    this.stop();
  }

  stop() {
    if (this.started) {
      logDebug('Stopping PageLoadElementTimingObserver');
      this.observer.disconnect();
      this.clearElements();
      this.started = false;
    }
  }

  clearElements() {
    logDebug('Clearing element timing array');
    this.timingElements = [];
  }

  getTimingElements(): Array<PerformanceEntry> {
    if (!elementTimingSupported()) {
      return [];
    }

    if (this.timingElements.length > 0) {
      return this.timingElements.splice(0, this.timingElements.length);
    }

    // it may happen that the record is there, but not yet visible
    // we need to force-load it and return it
    return this.observer.takeRecords();
  }

  handleObserve = (list: PerformanceObserverEntryList) => {
    list.getEntries().forEach(entry => this.timingElements.push(entry));
  };
}

export default PageLoadElementTimingObserver;

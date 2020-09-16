/* @flow */
import type { Dispatcher } from './types';
import CommandExecutor from '../CommandExecutor';
import { logDebug } from '../common';
import { longTaskSupported } from '../longtask/utils';

class LongTaskDispatcher implements Dispatcher {
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
    return longTaskSupported();
  }

  start() {
    if (!this.supported()) {
      logDebug('Long task API is not supported, skipping LongTaskDispatcher');
    }

    if (!this.started) {
      this.started = true;

      try {
        this.observer = new PerformanceObserver(this.handleObserve);
        this.observer.observe({ entryTypes: ['longtask'] });
        logDebug('LongTaskDispatcher started');
      } catch (ex) {
        this.started = false;
        logDebug('Error starting LongTaskDispatcher');
      }
    }
  }

  pause() {
    if (this.started) {
      this.started = false;
      this.observer.disconnect();

      logDebug('LongTaskDispatcher paused');
    }
  }

  handleObserve = (list: PerformanceObserverEntryList) => {
    if (this.started) {
      const entries = list.getEntries();
      this.executors.forEach(e => e.execute('longTask', entries));
    }
  }
}

export default LongTaskDispatcher;

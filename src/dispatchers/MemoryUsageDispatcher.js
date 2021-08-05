/* @flow */
import type { Dispatcher } from './types';
import CommandExecutor from '../CommandExecutor';
import { logDebug } from '../common';
import {
  memoryUsageSupported,
  MEASUREMENT_INTERVAL_IN_MS,
} from '../memory/utils';

class MemoryUsageDispatcher implements Dispatcher {
  executors: Array<CommandExecutor>;
  started: boolean;

  constructor() {
    this.executors = [];
    this.started = false;
  }

  addExecutor(executor: CommandExecutor) {
    this.executors.push(executor);
  }

  start() {
    if (!memoryUsageSupported()) {
      logDebug('Memory Usage API is not supported, skipping MemoryUsageDispatcher');
      return;
    }

    if (!this.started) {
      // check if the page is loaded
      if (document.readyState === 'complete') {
        this.checkStateAndSchedule();
      } else {
        // if the page is not loaded, add listener
        document.addEventListener('readystatechange', () => {
          this.checkStateAndSchedule();
        });
      }
    }
  }

  checkStateAndSchedule() {
    if (document.readyState === 'complete') {
      this.started = true;
      this.scheduleMeasurement(100);
    }
  }

  pause() {
    if (this.started) {
      this.started = false;
      logDebug('MemoryUsageDispatcher paused');
    }
  }

  scheduleMeasurement(timeout: number) {
    if (memoryUsageSupported()) {
      logDebug('Scheduling memory usage measurement');
      setTimeout(() => {
        this.getAndSendMeasurement();
      }, timeout);
    }
  }

  getAndSendMeasurement() {
    try {
      //$FlowFixMe
      performance.measureUserAgentSpecificMemory().then((measurements) => {
        this.executors.forEach(e => e.execute('memoryUsage', measurements));
      });
    } catch (error) {
      logDebug(`Cannot measure memory: ${error.message}.`);
    }
    this.scheduleMeasurement(MEASUREMENT_INTERVAL_IN_MS);
  }
}

export default MemoryUsageDispatcher;

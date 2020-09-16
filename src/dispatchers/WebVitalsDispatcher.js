/* @flow */
import {
  getCLS,
  getFID,
  getLCP,
  getFCP,
  getTTFB,
} from 'web-vitals';
import type { Dispatcher } from './types';
import CommandExecutor from '../CommandExecutor';

class WebVitalsDispatcher implements Dispatcher {
  executors: Array<CommandExecutor>;
  started: boolean;

  constructor() {
    this.executors = [];
    this.started = false;
  }

  addExecutor(executor: CommandExecutor) {
    this.executors.push(executor);
  }

  makeHandler(metricName: string) {
    return (metric: any) => {
      this.handleMetric(metricName, metric.value);
    };
  }

  handleMetric(metricName: string, value: number) {
    this.executors.forEach(e =>
      e.execute('vital-metric', { metricName, value }));
  }

  start() {
    if (!this.started) {
      getCLS(this.makeHandler('cumulativeLayoutShift'));
      getFID(this.makeHandler('firstInputDelay'));
      getLCP(this.makeHandler('largestContentfulPaint'));
      getFCP(this.makeHandler('firstContentfulPaint'));
      getTTFB(this.makeHandler('timeToFirstByte'));
    }
  }

  pause() {
    if (this.started) {
      this.started = false;
    }
  }
}

export default WebVitalsDispatcher;

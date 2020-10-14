/* @flow */
export type Configuration = {
  token: string,
  receiverUrl: string,
  resolveUrl: ?Function,
  sendDelay: ?number,
  maxDelay: ?number,
  release: ?string,
  ignoreOrigins: ?Array<string>,
}

export type MetricType = 'pageLoad' | 'ajax' | 'transaction' | 'routeChange' | 'longTask' |
  'elementTiming' | 'vitals' | 'memoryUsages';

export interface Uploader {
  enqueue(source: Object, type: MetricType): void,
  sendBatch(): void,
}

export interface VisibilityListener {
  start(): void;
  pause(): void;
}

export interface VisibilityObserver {
  addListener(listener: VisibilityListener): void,
}

export interface ElementTimingObserver {
  start(): void;
  pause(): void;
}

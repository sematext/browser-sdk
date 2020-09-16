/* @flow */
import type { Uploader, Configuration } from '../types';

export type UserInfo = {
  name: ?string,
  identifier: string,
  anonymous: boolean,
};

export type CommandContext = {
  config: ?Configuration,
  uploader: ?Uploader,
  scope: Object,
  user: ?UserInfo,
  sessionID: string,
  anonUserID: string,
  name: string,
}

export interface Command {
  constructor(context: CommandContext): void,
  execute(args: Array<any>): void,
}

export type ResourceTiming = {
  connectEnd?: number,
  connectStart?: number,
  decodedBodySize?: number,
  domainLookupEnd?: number,
  domainLookupStart?: number,
  encodedBodySize?: number,
  fetchStart: number,
  redirectEnd?: number,
  redirectStart?: number,
  requestStart?: number,
  responseEnd: number,
  responseStart?: number,
  secureConnectionStart?: number,
  transferSize?: number,
}

export type UrlInfo = {
  protocol: string,
  hostname: string,
  port: string,
  pathname: ?string,
  search: ?string,
  hash: ?string,
};

export type AjaxPayload = {
  url: string,
  status: number,
  timing: ?ResourceTiming,
  timestamp: Date,
};

export type AjaxMetrics = ResourceTiming & {
  '@timestamp': string,
  url: UrlInfo,
  status: number,
};

export type PageLoadTiming = {
  navigationStart: number,
  unloadEventStart?: number,
  unloadEventEnd?: number,
  redirectStart?: number,
  redirectEnd?: number,
  fetchStart: number,
  domainLookupStart?: number,
  domainLookupEnd?: number,
  connectStart?: number,
  connectEnd?: number,
  secureConnectionStart?: number,
  requestStart?: number,
  responseStart?: number,
  responseEnd?: number,
  domLoading?: number,
  domInteractive?: number,
  domContentLoadedEventStart?: number,
  domContentLoadedEventEnd?: number,
  domComplete?: number,
  loadEventStart?: number,
  loadEventEnd?: number,
};

export type PageLoadMetrics = PageLoadTiming & {
  '@timestamp': string,
  initiator: string,
  url: UrlInfo,
  startedOffset?: number,
  resources: string,
};

export type LongTaskAttribute = {
  name?: string,
  entryType?: string,
  startTime?: number,
  duration?: number,
  containerType?: string,
  containerSrc?: string,
  containerId?: string,
  containerName?: string,
};

export type LongTask = {
  name?: string,
  entryType?: string,
  startTime?: number,
  duration?: number,
  attribution?: Array<LongTaskAttribute>,
};

export type IntersectionRect = {
  x?: number,
  y?: number,
  width?: number,
  height?: number,
  top?: number,
  right?: number,
  bottom?: number,
  left?: number,
};

export type ElementTiming = {
  name: string,
  entryType?: string,
  startTime: number,
  duration: number,
  renderTime: number,
  loadTime?: number,
  identifier?: string,
  naturalWidth?: number,
  naturalHeight?: number,
  id?: string,
  url?: string,
  intersectionRect: IntersectionRect,
};

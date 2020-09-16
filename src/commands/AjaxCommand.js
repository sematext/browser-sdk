/* @flow */
import type {
  AjaxMetrics,
  AjaxPayload,
  Command,
  CommandContext,
} from './types';
import { toUrlInfo, getDefaultMeta } from '../common';

class AjaxCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  collectMetrics(payload: AjaxPayload): ?AjaxMetrics {
    const { timing, timestamp } = payload;

    const { config } = this.context;

    const resolveUrl = config && config.resolveUrl;

    const url = toUrlInfo(payload.url, resolveUrl);

    if (timing) {
      const metrics = {
        connectEnd: timing.connectEnd,
        connectStart: timing.connectStart,
        decodedBodySize: timing.decodedBodySize,
        domainLookupEnd: timing.domainLookupEnd,
        domainLookupStart: timing.domainLookupStart,
        encodedBodySize: timing.encodedBodySize,
        fetchStart: timing.fetchStart,
        redirectEnd: timing.redirectEnd,
        redirectStart: timing.redirectStart,
        requestStart: timing.requestStart,
        responseEnd: timing.responseEnd,
        responseStart: timing.responseStart,
        secureConnectionStart: timing.secureConnectionStart,
        transferSize: timing.transferSize,
      };

      return {
        ...metrics,
        status: payload.status,
        url,
        meta: getDefaultMeta(this.context),
        '@timestamp': timestamp.toISOString(),
      };
    }

    // todo: handle browsers that don't have resource timing api
    return null;
  }

  execute(args: Array<any>) {
    if (!args[0]) {
      throw new Error('invalid payload argument');
    }

    const payload: AjaxPayload = args[0];

    // ignore ajax requests made to the rum receiver because that would cause a loop
    const { config } = this.context;

    if (config) {
      const { receiverUrl } = config;
      const ignoreOrigins = config.ignoreOrigins || [];
      const ignoreOrigin = payload.url.indexOf(receiverUrl) === 0 ||
        ignoreOrigins.filter(o => payload.url.indexOf(o) === 0).length > 0;

      if (ignoreOrigin) {
        return;
      }
    }

    const metrics = this.collectMetrics(payload);
    if (metrics) {
      const { uploader } = this.context;
      if (metrics && uploader) {
        uploader.enqueue(metrics, 'ajax');
      }
    }
  }
}

export default AjaxCommand;

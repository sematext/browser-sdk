/* @flow */
import requests from './requests';
import { setCookie, getCookie, getMaxRequestSize, byteCount } from './common';
import { clearPerformanceBuffer } from './buffer';
import type { CommandContext } from './commands';
import type { Configuration, Uploader, MetricType } from './types';

const DEFAULT_MAX_DELAY = 15000;
const DEFAULT_DELAY = 5000;

/**
 * Uploads the data to rum receiver.
 */
class RumUploader implements Uploader {
  context: CommandContext;
  contextName: string;
  sending: boolean;
  numSending: number;
  setupDone: boolean;
  queue: Array<Object>;
  maxDelayInterval: ?IntervalID;
  delayTimer: ?TimeoutID;
  maxDelay: ?number;
  sendDelay: ?number;
  sendBreakdowns: boolean;

  /**
   * Constructor.
   */
  constructor(context: CommandContext, contextName: string) {
    this.context = context;
    this.contextName = contextName;
    this.sending = false;
    this.setupDone = false;
    this.sendBreakdowns = false;
    this.numSending = 0;
    this.queue = [];
    if (context.config) {
      this.setup(context.config);
    }
  }

  setup(config: Configuration) {
    this.maxDelay = config.maxDelay;
    this.sendDelay = config.sendDelay;
    this.sendBreakdowns = config.sendBreakdowns;
    this.maxDelayInterval = setInterval(() => {
      this.sendBatch();
    }, this.maxDelay || DEFAULT_MAX_DELAY);
    window.addEventListener('unload', () => this.sendBatchOnClose.bind(this)());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendBatchOnClose.bind(this)();
      }
    }, false);
    this.setupDone = true;
  }

  enqueue(source: Object, type: MetricType) {
    if (!this.setupDone) {
      if (this.context.config) {
        this.setup(this.context.config);
      }
    }

    this.shouldSend().then(() => {
      this.queue.push({ source, type });
      this.resetDelayTimeout();
    });
  }

  shouldSend(): Promise<any> {
    if (!this.setupDone) { return Promise.reject(); }
    if (!this.context.config) { return Promise.reject(); }
    const { receiverUrl, token } = this.context.config;
    const samplingDisabledCookie = `${token}-sampling-disabled`;
    const appDisabledCookie = `${token}-app-disabled`;

    return new Promise((resolve) => {
      if (getCookie(appDisabledCookie)) {
        return;
      }

      if (getCookie(samplingDisabledCookie)) {
        resolve();
        return;
      }

      // ask receiver if this event should be sent
      const url = `${receiverUrl}/sampling/${token}`;
      requests.head(url).then((xhr) => {
        const appActive = xhr.getResponseHeader('X-Sematext-Experience-App-Active') === 'true';
        const samplingEnabled = xhr.getResponseHeader('X-Sematext-Experience-Sampling-Active') === 'true';
        const sendNextEvent = xhr.getResponseHeader('X-Sematext-Experience-Sampling-NextEvent') === 'true';

        // avoid sending data when App is not active
        if (!appActive) {
          setCookie(appDisabledCookie, 'true', 15);
          return;
        }

        if (!samplingEnabled) {
          setCookie(samplingDisabledCookie, 'true', 15);
          resolve();
          return;
        }

        if (sendNextEvent) {
          resolve();
        }
      });
    });
  }

  resetDelayTimeout() {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
    }

    this.delayTimer = setTimeout(() => { this.sendBatch(); }, this.sendDelay || DEFAULT_DELAY);
  }

  sendBatchOnClose() {
    if (!this.canSend()) { return true; }
    //$FlowFixMe
    if (navigator && navigator.sendBeacon && navigator instanceof Navigator) {
      const {
        batches,
      } = this.prepareData();
      for (let batchId = 0; batchId < batches.length; batchId += 1) {
        //$FlowFixMe
        navigator.sendBeacon(this.prepareReceiverUrl(), batches[batchId]);
        clearPerformanceBuffer();
        this.queue = this.queue.filter(doc => (!doc.inflight && doc.batchid !== batchId));
      }
      return true;
    }
    return true;
  }

  sendBatch() {
    if (!this.canSend()) { return; }

    this.sending = true;
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
    }

    if (this.maxDelayInterval) {
      clearInterval(this.maxDelayInterval);
    }
    this.maxDelayInterval = setInterval(() => {
      this.sendBatch();
    }, this.maxDelay || DEFAULT_MAX_DELAY);

    const {
      batches,
    } = this.prepareData();
    for (let batchId = 0; batchId < batches.length; batchId += 1) {
      this.numSending += 1;
      requests.post(this.prepareReceiverUrl(), batches[batchId]).then((xhr) => {
        if (xhr.status >= 200 && xhr.status < 300) {
          this.queue = this.queue.filter(doc => (!doc.inflight && doc.batchid !== batchId));
          this.numSending -= 1;
          if (this.numSending === 0) {
            this.sending = false;
          }
        }
      }).catch(() => {
        this.queue.forEach((doc, idx) => {
          this.queue[idx].inflight = false;
          this.queue[idx].batchid = -1;
        });
        this.numSending -= 1;
        if (this.numSending === 0) {
          this.sending = false;
        }
      });
    }

    clearPerformanceBuffer();
  }

  canSend() {
    if (this.queue.length === 0) { return false; }
    if (this.numSending > 0) { return false; }
    if (this.sending) { return false; }
    if (!this.setupDone) { return false; }
    if (!this.context.config) { return false; }
    return true;
  }

  prepareReceiverUrl() {
    const receiverUrl = this.context.config && this.context.config.receiverUrl ?
      this.context.config.receiverUrl : '';
    const token = this.context.config && this.context.config.token ? this.context.config.token : '';
    return `${receiverUrl}/api/v1/apps/${token}/data`;
  }

  prepareData() {
    const batches = [];
    let batch = {
      pageLoad: [],
      ajax: [],
      transaction: [],
      longTask: [],
      elementTiming: [],
      vitals: [],
      memoryUsages: [],
    };
    let requestSize = 0;
    let batchid = 0;
    for (let idx = 0; idx < this.queue.length; idx += 1) {
      const doc = this.queue[idx];
      if (batch[doc.type]) {
        batch[doc.type].push(doc.source);
        this.queue[idx].inflight = true;
        this.queue[idx].batchid = batchid;
        requestSize += byteCount(JSON.stringify(doc.source));
      }

      if (requestSize >= getMaxRequestSize()) {
        batches.push(JSON.stringify({
          body: batch,
        }));
        batchid += 1;
        requestSize = 0;
        batch = {
          pageLoad: [],
          ajax: [],
          transaction: [],
          longTask: [],
          elementTiming: [],
          vitals: [],
          memoryUsages: [],
        };
      }
    }

    if (requestSize !== 0) {
      batches.push(JSON.stringify({
        body: batch,
      }));
    }

    return {
      batches,
    };
  }

  stop() {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
    }
    if (this.maxDelayInterval) {
      clearInterval(this.maxDelayInterval);
    }
  }
}

export default RumUploader;

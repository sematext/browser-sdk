/* @flow */
import type { Dispatcher } from './types';
import type { AjaxPayload } from '../commands/types';
import { checkTaint, registerAjaxListener, AjaxListener, removeAjaxListener } from '../ajax';
import { toAbsoluteUrl, logDebug } from '../common';
import { markLastProcessed } from '../buffer';
import CommandExecutor from '../CommandExecutor';

class AjaxDispatcher implements Dispatcher {
  executors: Array<CommandExecutor>;
  started: boolean;

  constructor() {
    this.executors = [];
  }

  addExecutor(executor: CommandExecutor) {
    this.executors.push(executor);
  }

  createListener = (url: string): AjaxListener => ({
    timestamp: null,
    onSend: (listener: AjaxListener) => {
      listener.timestamp = new Date();
    },
    onLoadEnd: (listener: AjaxListener, taint, status) => {
      try {
        // SC-3055: Ignore requests with status = 0 for now
        // It's not entirely clear to me yet why they end up in loadend event but
        // there are cases where status = 0 for example when request times out
        if (status !== 0) {
          setTimeout(() => this.handleLoadend(
            listener.timestamp,
            url,
            taint,
            status,
          ), 100);
        }
      } catch (e) {
        logDebug(e);
      }
    },
  });

  start() {
    if (!this.started) {
      this.started = true;
      registerAjaxListener(this.createListener);
      logDebug('AjaxListener started');
    }
  }

  pause() {
    if (this.started) {
      this.started = false;
      removeAjaxListener(this.createListener);
      logDebug('AjaxListener paused');
    }
  }

  handleLoadend(
    timestamp: Date,
    url: string,
    taint: string,
    status: number,
  ) {
    let payload: ?AjaxPayload = null;
    const absoluteUrl = toAbsoluteUrl(url);

    if (window.performance && window.performance.getEntries) {
      const timingEntries = window.performance.getEntries();
      const timing = timingEntries.find(e => e.name && checkTaint(e.name, taint));
      if (timing) {
        payload = {
          timestamp,
          url: absoluteUrl,
          timing,
          status,
        };

        markLastProcessed(timing);
      }
    }

    if (payload) {
      this.executors.forEach(e => e.execute('ajax', payload));
    } else {
      logDebug('Could not find timing entry', url, taint);
    }
  }
}

export default AjaxDispatcher;

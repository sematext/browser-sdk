/* @flow */
import { createListeners } from './listeners';
import { taintUrl } from './common';

export default function patchXhr(scopeObject: any) {
  const { XMLHttpRequest } = scopeObject;

  const pOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function open(method, originalUrl, ...args) {
    const { url, taint } = taintUrl(originalUrl);
    this.__listeners = createListeners(originalUrl);
    this.addEventListener('loadend', (event) => {
      this.__listeners.forEach(l => l.onLoadEnd && l.onLoadEnd(l, taint, event.target.status));
    });
    return pOpen.apply(this, [method, url, ...args]);
  };


  const pSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function send(...args) {
    this.__listeners.forEach(l => l.onSend && l.onSend(l));
    return pSend.apply(this, args);
  };
}

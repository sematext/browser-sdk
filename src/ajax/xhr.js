/* @flow */
import { createListeners } from './listeners';
import { taintUrl } from './common';

export default function patchXhr(scopeObject: any) {
  const { XMLHttpRequest } = scopeObject;
  scopeObject.XMLHttpRequest = () => {
    const req = new XMLHttpRequest();

    try {
      const open = req.open.bind(req);
      const send = req.send.bind(req);
      let listeners;

      req.open = (method, originalUrl, ...props) => {
        const { url, taint } = taintUrl(originalUrl);
        listeners = createListeners(originalUrl);
        req.addEventListener('loadend', (event) => {
          listeners.forEach(l => l.onLoadEnd && l.onLoadEnd(l, taint, event.target.status));
        });

        return open.apply(req, [method, url, ...props]);
      };

      req.send = (...props) => {
        listeners.forEach(l => l.onSend && l.onSend(l));
        return send.apply(req, props);
      };
    } finally {
      // do nothing
    }

    return req;
  };
}

/* @flow */
import { createListeners } from './listeners';
import { taintUrl } from './common';

export default function patchFetch(scopeObject: any) {
  const { fetch } = scopeObject;

  scopeObject.fetch = (urlOrRequest, ...args) => {
    const request: any = (urlOrRequest && urlOrRequest.url) ?
      urlOrRequest : new Request(String(urlOrRequest));

    const {
      cache,
      credentials,
      headers,
      integrity,
      method,
      mode,
      redirect,
      referrer,
      referrerPolicy,
      body,
    } = request;


    const listeners = createListeners(request.url);
    listeners.forEach(l => l.onSend && l.onSend(l));

    // Create new request with tainted URL so we can easily find it in performance entries
    const { url, taint } = taintUrl(request.url);
    const newRequest = new Request(url, {
      cache,
      credentials,
      headers,
      integrity,
      method,
      mode,
      redirect,
      referrer,
      referrerPolicy,
      body,
    });

    const promise = fetch(newRequest, ...args);

    promise.then(res =>
      listeners.forEach(l => l.onLoadEnd && l.onLoadEnd(l, taint, res.status)));

    return promise;
  };
}

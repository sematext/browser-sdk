/* @flow */
import { createListeners } from './listeners';
import { taintUrl, isUrlIgnored } from './common';
import { logDebug } from '../common';

export default function patchFetch(scopeObject: any, ignoreList: string[]) {
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
    } = request;

    const ignored = isUrlIgnored(request.url, ignoreList);
    if (ignored) {
      // if the request is ignored try sending the original one if possible
      return (urlOrRequest && urlOrRequest.url) ?
        fetch(new Request(urlOrRequest), ...args) : fetch(request, ...args);
    }

    const listeners = createListeners(request.url);
    listeners.forEach(l => l.onSend && l.onSend(l));

    // Create new request with tainted URL so we can easily find it in performance entries
    const { url, taint } = taintUrl(request.url);

    // Request body is fetched asynchronously
    return request.blob().then((body) => {
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
        body: method.toLowerCase() === 'get' || method.toLowerCase() === 'head' ? undefined : body,
      });

      const promise = fetch(newRequest, ...args);
      promise.then(res =>
        listeners.forEach(l => l.onLoadEnd && l.onLoadEnd(l, taint, res.status)));
      return promise;
    }).catch((error) => {
      logDebug('Can/\t read request body', error);
    });
  };
}

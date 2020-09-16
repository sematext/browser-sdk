/* @flow */
import type { AjaxListener, AjaxListenerFactory } from './types';

let factories: Array<AjaxListenerFactory> = [];

export function registerAjaxListener(createListener: AjaxListenerFactory) {
  factories.push(createListener);
}

export function removeAjaxListener(createListener: AjaxListenerFactory) {
  factories = factories.filter(el => el !== createListener);
}

export function createListeners(url: string): Array<AjaxListener> {
  return factories.map(f => f(url));
}

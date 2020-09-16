/* @flow */
import type { RouteChangeListener } from './types';
import type { CommandContext } from '../commands';

let listeners: Array<RouteChangeListener> = [];

export function registerRouteChangeListener(listener: RouteChangeListener) {
  listeners.push(listener);
}

export function removeRouteChangeListener(listener: RouteChangeListener) {
  listeners = listeners.filter(el => el !== listener);
}

export function informOnRouteChangeListeners(pathname: string, context: CommandContext) {
  listeners.forEach(f => f.onRouteChange && f.onRouteChange(pathname, context));
}

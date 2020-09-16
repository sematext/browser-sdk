/* @flow */
import type { VisibilityListener, VisibilityObserver } from './types';

class DocumentVisibilityObserver implements VisibilityObserver {
  listeners: Array<VisibilityListener>;
  started: boolean;

  constructor() {
    this.listeners = [];
    this.started = false;

    // add listeners to support all browser visibility change events
    document.addEventListener('visibilitychange', this.handleVisibilityChange, false);
    document.addEventListener('msvisibilitychange', this.handleVisibilityChange, false);
    document.addEventListener('webkitvisibilitychange', this.handleVisibilityChange, false);
  }

  isVisible = () => {
    if (this.started) {
      return document.visibilityState === 'visible';
    }
    return true;
  }

  addListener(listener: VisibilityListener) {
    this.listeners.push(listener);
  }

  pause() {
    this.listeners.forEach((listener) => {
      listener.pause();
    });
  }

  start() {
    this.listeners.forEach((listener) => {
      listener.start();
    });
  }

  startListening() {
    this.started = true;
  }

  handleVisibilityChange = () => {
    if (this.started) {
      if (!this.isVisible()) {
        this.pause();
      } else {
        this.start();
      }
    }
  }
}

export default DocumentVisibilityObserver;

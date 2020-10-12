/* @flow */
import 'core-js/fn/array/filter';
import 'core-js/fn/array/find';
import 'core-js/fn/string/starts-with';

import CommandExecutor from './CommandExecutor';
import PageLoadDispatcher from './dispatchers/PageLoadDispatcher';
import RumUploader from './RumUploader';
import bootstrap from './bootstrap';
import AjaxDispatcher from './dispatchers/AjaxDispatcher';
import { GLOBAL_KEY } from './constants';
import { setupContext, keepSessionAlive } from './common';
import patchXhr from './ajax/xhr';
import patchFetch from './ajax/fetch';
import DocumentVisibilityObserver from './DocumentVisibilityObserver';
import ElementTimingDispatcher from './dispatchers/ElementTimingDispatcher';
import WebVitalsDispatcher from './dispatchers/WebVitalsDispatcher';
import MemoryUsageDispatcher from './dispatchers/MemoryUsageDispatcher';

const contextNames = window.STRUM_CONTEXTS || [GLOBAL_KEY];

patchXhr(window);
patchFetch(window);

const visibilityObserver = new DocumentVisibilityObserver();
const pageLoadDispatcher = new PageLoadDispatcher();
const ajaxDispatcher = new AjaxDispatcher();
const elementTimingDispatcher = new ElementTimingDispatcher();
const webVitalsDispatcher = new WebVitalsDispatcher();
const memoryUsageDispatcher = new MemoryUsageDispatcher();

visibilityObserver.addListener(pageLoadDispatcher);
visibilityObserver.addListener(ajaxDispatcher);
visibilityObserver.addListener(elementTimingDispatcher);
// DON'T: visibilityObserver.addListener(webVitalsDispatcher);
// we're not adding web vitals dispatcher to the visibility observer because we
// don't control the implementation of how metric are collected and I believe
// that web-vitals already does some visibility change handling.
// We don't want to add memoryUsageDispatcher to visibility obeserver as well.

contextNames.forEach((contextName) => {
  const context = setupContext(contextName);
  keepSessionAlive(context.sessionID);

  const uploader = new RumUploader(context, contextName);
  context.uploader = uploader;

  const executor = new CommandExecutor(context, contextName);
  visibilityObserver.addListener(executor);

  bootstrap(executor, window, contextName).then(() => {
    pageLoadDispatcher.addExecutor(executor);
    ajaxDispatcher.addExecutor(executor);
    elementTimingDispatcher.addExecutor(executor);
    webVitalsDispatcher.addExecutor(executor);
    memoryUsageDispatcher.addExecutor(executor);
  });
});

// start page load and ajax dispatchers
pageLoadDispatcher.start();
ajaxDispatcher.start();
elementTimingDispatcher.start();
webVitalsDispatcher.start();
memoryUsageDispatcher.start();

// start observing visibility changes
visibilityObserver.startListening();

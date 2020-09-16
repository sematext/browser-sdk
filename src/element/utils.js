/* @flow */

// eslint-disable-next-line import/prefer-default-export
import type { ElementTiming, IntersectionRect } from '../commands/types';

export const elementTimingSupported = (): boolean => {
  if (window.PerformanceObserver && window.PerformanceObserver.supportedEntryTypes &&
    PerformanceObserver.supportedEntryTypes.indexOf('element') >= 0) {
    return true;
  }
  return false;
};

export const disconnectGlobalObserver = (contextName: string) => {
  if (window[`${contextName}lt`] && window[`${contextName}lt`].observer &&
    window[`${contextName}lt`].observer !== undefined) {
    window[`${contextName}lt`].observer.disconnect();
  }
};

export const getGlobalElementTiming = (contextName: string): Array<PerformanceEntry> => {
  if (!elementTimingSupported()) {
    return [];
  }

  if (!window[`${contextName}lt`] || !window[`${contextName}lt`].timingElements) {
    return [];
  }

  if (window[`${contextName}lt`].timingElements.length > 0) {
    return window[`${contextName}lt`].timingElements.slice(0);
  }

  // try retrieving the timing element via the observer
  // we need to check if the observer is present and defined
  if (window[`${contextName}lt`].observer && window[`${contextName}lt`].observer !== undefined) {
    const observerElements = window[`${contextName}lt`].observer.takeRecords();
    if (observerElements && observerElements.length > 0) {
      const timingElements = [];
      observerElements.getEntries().forEach((e) => {
        switch (e.entryType) {
          case 'element':
            timingElements.push(e);
            break;
          default:
            break;
        }
      });
      return timingElements;
    }
  }

  return [];
};

export const cleanGlobalElementTiming = (contextName: string) => {
  if (window[`${contextName}lt`] && window[`${contextName}lt`].timingElements) {
    window[`${contextName}lt`].timingElements = [];
  }
};

export const isElementTimingInPageLoad = (contextName: string): boolean => {
  if (window[`${contextName}lt`] && window[`${contextName}lt`].inPageLoad !== undefined) {
    return window[`${contextName}lt`].inPageLoad;
  }
  return true;
};

export const setElementTimingInPageLoad = (contextName: string) => {
  if (window[`${contextName}lt`] && window[`${contextName}lt`].inPageLoad) {
    window[`${contextName}lt`].inPageLoad = true;
  }
};

export const setElementTimingOutsidePageLoad = (contextName: string) => {
  if (window[`${contextName}lt`] && window[`${contextName}lt`].inPageLoad) {
    window[`${contextName}lt`].inPageLoad = false;
  }
};

export const getAdjustedElementTimings = (
  elementTimings: Array<PerformanceEntry>,
  startedOffset: number,
): Array<ElementTiming> => {
  const elems: Array<ElementTiming> = [];
  if (elementTimings.length > 0) {
    elementTimings.forEach((e) => {
      const {
        name,
        entryType,
        startTime,
        duration,
        //$FlowFixMe
        renderTime,
        //$FlowFixMe
        loadTime,
        //$FlowFixMe
        identifier,
        //$FlowFixMe
        naturalWidth,
        //$FlowFixMe
        naturalHeight,
        //$FlowFixMe
        id,
        //$FlowFixMe
        url,
        //$FlowFixMe
        intersectionRect: {
          x,
          y,
          width,
          height,
          top,
          right,
          bottom,
          left,
        },
      } = e;

      const rect: IntersectionRect = {
        x,
        y,
        width,
        height,
        top,
        right,
        bottom,
        left,
      };

      const element: ElementTiming = {
        name,
        entryType,
        startTime: startTime - startedOffset,
        renderTime: renderTime - startedOffset,
        duration,
        loadTime: loadTime - startedOffset,
        identifier,
        naturalWidth,
        naturalHeight,
        id,
        url,
        intersectionRect: rect,
      };
      elems.push(element);
    });
  }
  return elems;
};

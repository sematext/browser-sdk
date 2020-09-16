/* @flow */

// eslint-disable-next-line import/prefer-default-export
import type { LongTask, LongTaskAttribute } from '../commands/types';

export const longTaskSupported = (): boolean => {
  if (window.PerformanceObserver && window.PerformanceObserver.supportedEntryTypes &&
    PerformanceObserver.supportedEntryTypes.indexOf('longtask') >= 0) {
    return true;
  }
  return false;
};

export const getGlobalLongTasks = (contextName: string): Array<PerformanceEntry> => {
  if (!longTaskSupported()) {
    return [];
  }

  if (!window[`${contextName}lt`] || !window[`${contextName}lt`].longTasks) {
    return [];
  }

  if (window[`${contextName}lt`].longTasks.length > 0) {
    return window[`${contextName}lt`].longTasks.slice(0);
  }

  return [];
};

export const cleanGlobalLongTasks = (contextName: string) => {
  if (window[`${contextName}lt`] && window[`${contextName}lt`].longTasks) {
    window[`${contextName}lt`].longTasks = [];
  }
};

export const getAdjustedLongTasks = (
  longTasks: Array<PerformanceEntry>,
  startedOffset: number,
): Array<LongTask> => {
  const elems: Array<LongTask> = [];
  if (longTasks.length > 0) {
    longTasks.forEach((e) => {
      const {
        name,
        entryType,
        startTime,
        duration,
        //$FlowFixMe
        attribution,
      } = e;

      let longTaskStartTime = startTime - startedOffset;
      // It may happen that the actual startTime is lower than startedOffset.
      // In such case, just set the startTime to 1.
      if (longTaskStartTime < 0) {
        longTaskStartTime = 1;
      }

      const attributes: Array<LongTaskAttribute> = [];
      if (attribution !== undefined && attribution.length > 0) {
        for (let i = 0; i < attribution.length; i += 1) {
          const {
            // eslint-disable-next-line no-shadow
            name,
            // eslint-disable-next-line no-shadow
            entryType,
            // eslint-disable-next-line no-shadow
            startTime,
            // eslint-disable-next-line no-shadow
            duration,
            containerType,
            containerSrc,
            containerId,
            containerName,
          } = attribution[i];

          let longTaskAttributeStartTime = startTime - startedOffset;
          if (longTaskAttributeStartTime < 0) {
            longTaskAttributeStartTime = 1;
          }

          const longTaskAttrib: LongTaskAttribute = {
            name,
            entryType,
            startTime: longTaskAttributeStartTime,
            duration,
            containerType,
            containerSrc,
            containerId,
            containerName,
          };

          attributes.push(longTaskAttrib);
        }
      }

      const longTask: LongTask = {
        name,
        entryType,
        startTime: longTaskStartTime,
        duration,
        attribution: attributes,
      };

      elems.push(longTask);
    });
  }
  return elems;
};

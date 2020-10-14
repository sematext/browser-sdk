/* @flow */

// memory usage interval set by default to 1 minute
export const MEASUREMENT_INTERVAL_IN_MS = 60 * 1000;

//$FlowFixMe
export const memoryUsageSupported = (): boolean => performance.measureMemory;

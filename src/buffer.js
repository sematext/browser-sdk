/* @flow */
import { logDebug, uuid4 } from './common';

let bufferLocks = [];

/**
 * Acquires a lock on the performance buffer preventing any buffer clearing.
 *
 * This is used when a group of entries needs to be preserved before they are
 * cleared, like when waiting for the route change process to be over.
 */
export function lockPerformanceBuffer() {
  const lockId = uuid4();
  logDebug('Locking performance buffer', lockId);
  bufferLocks.push(lockId);
  return lockId;
}

export function unlockPerformanceBuffer(lockId: string) {
  logDebug('Removing performance buffer lock', lockId);

  bufferLocks = bufferLocks.filter(l => l !== lockId);

  if (bufferLocks.length === 0) {
    logDebug('Performance buffer unlocked');
  }
}

/**
 * Marks the performance entry as last processed entry.
 *
 * This is later used to determine if the buffer can be cleared or not.
 */
export function markLastProcessed(entry: Object) {
  entry.__processed = true;
}

export function clearPerformanceBuffer() {
  if (window.performance && window.performance.getEntries) {
    const entries = window.performance.getEntries();

    // some browsers report empty performance buffer so we should check to avoid errors
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];

      if (bufferLocks.length === 0 && lastEntry.__processed) {
        window.performance.clearResourceTimings();
        logDebug('Cleared performance buffer');
      } else {
        logDebug(window.performance.getEntries());
        logDebug('Skipped clearing performance buffer since it\'s locked');
      }
    }
  }
}

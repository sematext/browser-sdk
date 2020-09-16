/* @flow */
import { toAbsoluteUrl, uuid4 } from '../common';

export function taintUrl(url: string): Object {
  const parsedUrl = new URL(toAbsoluteUrl(url));
  const taint = uuid4();
  parsedUrl.hash += taint;
  return {
    url: parsedUrl.href,
    taint,
  };
}

export function checkTaint(url: string, taint: string): boolean {
  const parsedUrl = new URL(toAbsoluteUrl(url));

  if (parsedUrl.hash.endsWith(taint)) {
    return true;
  }

  return false;
}

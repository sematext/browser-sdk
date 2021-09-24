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

export function isUrlIgnored(url: string, ignoreList: string[]): boolean {
  for (let i = 0; i < ignoreList.length; i += 1) {
    if (url.startsWith(ignoreList[i])) {
      return true;
    }
  }
  return false;
}

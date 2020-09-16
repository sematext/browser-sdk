/* @flow */

export type AjaxListener = {
  onSend?: (listener: AjaxListener) => void,
  onLoadEnd?: (listener: AjaxListener, taint: string, status: number) => void,
}

export type AjaxListenerFactory = (url: string) => AjaxListener;

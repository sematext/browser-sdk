/* @flow */
import type { Command, CommandContext } from './types';
import { toUrlInfo, getDefaultMeta } from '../common';
import { getPageLoadUuid } from './PageLoadCommand';

class VitalMetricCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  supported() {
    return true;
  }

  execute(args: Array<any>) {
    if (typeof args[0] !== 'object') {
      throw new Error('command requires one argument: object with `name` and `value`');
    }

    if (!this.supported()) {
      return;
    }

    const { metricName, value } = args[0];
    const { uploader, config } = this.context;
    const timestamp = new Date();
    const resolveUrl = config && config.resolveUrl;
    const metrics = {
      [metricName]: value,
      pageLoadUuid: getPageLoadUuid(),
      '@timestamp': timestamp.toISOString(),
      url: toUrlInfo(window.location, resolveUrl),
      meta: getDefaultMeta(this.context),
    };

    if (uploader) {
      uploader.enqueue(metrics, 'vitals');
    }
  }
}

export default VitalMetricCommand;

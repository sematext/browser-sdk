/* @flow */
import type { Command, CommandContext } from './types';
import { getPageLoadUuid } from './PageLoadCommand';
import { getDefaultMeta, toUrlInfo } from '../common';

class MemoryUsageCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute(args: Array<any>) {
    if (!args[0]) {
      throw new Error('invalid payload argument');
    }

    const { uploader, config } = this.context;
    const { breakdown } = args[0];
    const timestamp = new Date();
    const resolveUrl = config && config.resolveUrl;
    const pageLoadUuid = getPageLoadUuid();
    const url = toUrlInfo(window.location, resolveUrl);
    const meta = getDefaultMeta(this.context);

    breakdown.forEach((measurement) => {
      const {
        attribution,
        bytes,
        userAgentSpecificTypes,
      } = measurement;

      // create attribution objects
      const attributionArray = [];
      attribution.forEach((attrib) => {
        if (typeof attrib === 'string') {
          attributionArray.push({
            url: attrib,
          });
        } else {
          attributionArray.push(attrib);
        }
      });

      const usage = {
        bytes,
        attribution: attributionArray,
        userAgentSpecificTypes,
        pageLoadUuid,
        '@timestamp': timestamp.toISOString(),
        url,
        meta,
      };

      if (usage && uploader) {
        uploader.enqueue(usage, 'memoryUsages');
      }
    });
  }
}

export default MemoryUsageCommand;

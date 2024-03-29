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
    const { breakdown, bytes } = args[0];
    const timestamp = new Date();
    const resolveUrl = config && config.resolveUrl;
    const sendBreakdowns = config && config.sendBreakdowns;
    const pageLoadUuid = getPageLoadUuid();
    const url = toUrlInfo(window.location, resolveUrl);
    const meta = getDefaultMeta(this.context);

    // we add one additional object with total bytes
    if (bytes && uploader) {
      const totalUsageObject = {
        bytes,
        totalBytes: true,
        attribution: [],
        userAgentSpecificTypes: [],
        pageLoadUuid,
        '@timestamp': timestamp.toISOString(),
        url,
        meta,
      };
      uploader.enqueue(totalUsageObject, 'memoryUsages');
    }

    if (sendBreakdowns) {
      breakdown.forEach((measurement) => {
        const {
          attribution,
          // eslint-disable-next-line no-shadow
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
}

export default MemoryUsageCommand;

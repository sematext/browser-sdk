/* @flow */
import type { Command, CommandContext } from './types';
import type { Configuration } from '../types';
import { BOT_USER_AGENT } from '../constants';

class ConfigCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute(args: Array<any>) {
    if (typeof (args[0]) !== 'object') {
      throw new Error('Configuration object must be provided');
    }

    const params: Object = args[0];

    if (typeof (params.token) !== 'string' || !params.token) {
      throw new Error('Configuration object must have `token` string property');
    }

    if (typeof (params.receiverUrl) !== 'string' || !params.receiverUrl) {
      throw new Error('Configuration object must have `receiverUrl` string property');
    }

    if (params.ignoreBotData !== false) {
      if (BOT_USER_AGENT.test(navigator.userAgent.toLowerCase())) {
        return;
      }
    }

    const config: Configuration = args[0];
    this.context.config = config;
  }
}

export default ConfigCommand;

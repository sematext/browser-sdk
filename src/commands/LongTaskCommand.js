/* @flow */
import type { Command, CommandContext } from './types';

class LongTaskCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute(args: Array<any>) {
    if (!args[0]) {
      throw new Error('invalid payload argument');
    }

    const { uploader } = this.context;
    const payload = args[0];

    if (payload && uploader) {
      uploader.enqueue(payload, 'longTask');
    }
  }
}

export default LongTaskCommand;

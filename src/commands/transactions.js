/* @flow */
import type { Command, CommandContext } from './types';
import { getDefaultMeta } from '../common';

const transactions = {};

class StartTransactionCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute(args: Array<any>) {
    if (args.length < 1) {
      throw new Error('transaction name is required');
    }

    const name: string = args[0];

    if (!transactions[name]) {
      transactions[name] = {
        startTime: new Date(),
      };
    }
  }
}

class EndTransactionCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute(args: Array<any>) {
    if (args.length < 1) {
      throw new Error('transaction name is required');
    }

    const name: string = args[0];

    if (!transactions[name]) {
      throw new Error(`transaction "${name}" was never started`);
    }

    const { startTime } = transactions[name];
    const endTime = new Date();

    const doc = {
      name,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      meta: getDefaultMeta(this.context),
    };

    const { uploader } = this.context;
    if (uploader) {
      uploader.enqueue(doc, 'transaction');
    }

    delete transactions[name];
  }
}

export {
  StartTransactionCommand,
  EndTransactionCommand,
};

/* @flow */
import type { Command, CommandContext } from './types';
import { logDebug, getDefaultMeta } from '../common';

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

    const tags: Object = args[1];

    if (tags && typeof tags !== 'object') {
      throw new Error('if provided, second argument `tags` should be an object');
    }

    if (!transactions[name]) {
      transactions[name] = {
        startTime: new Date(),
        tags,
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

    const { startTime, tags } = transactions[name];
    const endTime = new Date();

    const doc = {
      name,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      meta: getDefaultMeta(this.context, tags),
    };

    const { uploader } = this.context;
    if (uploader) {
      uploader.enqueue(doc, 'transaction');
    }

    delete transactions[name];
  }
}

class RecordTransactionCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute(args: Array<any>) {
    if (args.length < 2) {
      throw new Error('transaction name is required');
    }

    const name: string = args[0];
    const startTime: number = args[1];
    const duration: number = args[2];

    if (!name || typeof name !== 'string') {
      throw new Error(`transaction name "${name}" is invalid or not provided`);
    }

    if (Number.isNaN(startTime) || !Number.isFinite(startTime) || startTime < 0) {
      throw new Error(`transaction startTime ${startTime} is invalid or not provided`);
    }

    if (!duration || Number.isNaN(duration) || !Number.isFinite(duration) || duration <= 0) {
      logDebug(`transaction duration "${duration}" is invalid or not provided`);
      return;
    }

    const { timing } = window.performance;
    const startDate = new Date(timing.fetchStart + startTime);
    const endDate = new Date(timing.fetchStart + startTime + duration);

    const doc = {
      name,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      meta: getDefaultMeta(this.context),
    };

    const { uploader } = this.context;
    if (uploader) {
      uploader.enqueue(doc, 'transaction');
    }
  }
}

export {
  StartTransactionCommand,
  EndTransactionCommand,
  RecordTransactionCommand,
};

/* @flow */
import type { Command, CommandContext, UserInfo } from './types';

class IdentifyCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute(args: Array<any>) {
    const obj = args[0];
    if (!obj) {
      throw new Error('Object with `name` and `identifier` keys should be provided');
    }

    if (typeof (obj.name) !== 'string' || !obj.name) {
      throw new Error('Object must have `name` string property');
    }

    if (typeof (obj.identifier) !== 'string' || !obj.identifier) {
      throw new Error('Object must have `identifier` string property');
    }

    const user: UserInfo = args[0];
    this.context.user = user;
  }
}

export default IdentifyCommand;

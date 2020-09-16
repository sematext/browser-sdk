/* @flow */
import commands from './commands';
import type { CommandType, CommandContext } from './commands';
import { logDebug } from './common';

class CommandExecutor {
  context: CommandContext;
  contextName: string;
  paused: boolean;

  constructor(context: CommandContext, contextName: string) {
    this.context = context;
    this.contextName = contextName;
    this.paused = false;
  }

  execute(commandType: CommandType, ...args: any) {
    const CommandClass = commands[commandType];
    const command = new CommandClass(this.context);
    if (!this.paused || commandType === 'config') {
      logDebug('Command:', commandType, args);
      command.execute(args);
    } else {
      logDebug('Ignoring command:', commandType, args);
    }
  }

  start() {
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }
}

export default CommandExecutor;

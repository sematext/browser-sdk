/* @flow */
import commands from './commands';
import type { CommandType } from './commands';
import { logDebug } from './common';
import CommandExecutor from './CommandExecutor';

const isValidCommand = (args): boolean => {
  const commandType = args[0];

  if (commandType && commands[commandType]) {
    return true;
  }

  return false;
};

const tryExecute = (executor, args) => {
  try {
    if (isValidCommand(args)) {
      const commandType: CommandType = args[0];
      const otherArgs = args.slice(1);
      executor.execute(commandType, ...otherArgs);
    } else {
      throw new Error('Invalid command provided');
    }
  } catch (e) {
    logDebug('unable to execute command', e);
  }
};

const runQueuedCommands = (scopeObject, contextName, executor, queuedCommands) => {
  if (queuedCommands) {
    const configIdx = queuedCommands.findIndex((args) => {
      const commandType: CommandType = args[0];
      return commandType === 'config';
    });

    if (configIdx !== -1) {
      // Bring config command to top because we should run that first
      const configCmd = queuedCommands.splice(configIdx, 1)[0];
      const orderedQueue = [
        configCmd,
        ...queuedCommands,
      ];

      while (orderedQueue.length > 0) {
        const argumentsObj = orderedQueue.shift();
        if (argumentsObj) {
          const args = Array.prototype.slice.call(argumentsObj);
          tryExecute(executor, args);
        }
      }

      // replace strum global function with command executor
      scopeObject[contextName] = (...args) => tryExecute(executor, args);
      return true;
    }
  }

  return false;
};

export default (
  executor: CommandExecutor,
  scopeObject: Object,
  contextName: String,
): Promise<any> =>
  // Return a promise that will be resolved when script is configured
  new Promise((resolve) => {
    if (!scopeObject[contextName]) {
      return;
    }

    // get commands that were queued before script was loaded so we can execute them
    const queuedCommands = scopeObject[contextName] && scopeObject[contextName].queue;

    let foundConfig = runQueuedCommands(scopeObject, contextName, executor, queuedCommands);
    if (foundConfig) {
      // config command was found in the initial queue of commands, we are done
      resolve();
      return;
    }

    // config command was not sent yet, we need to wait for it before running any other commands
    scopeObject[contextName] = (...args) => {
      queuedCommands.push(args);
      foundConfig = runQueuedCommands(
        scopeObject,
        contextName,
        executor,
        queuedCommands,
      );
      if (foundConfig) {
        resolve();
      }
    };
  });

/* @flow */
import CommandExecutor from '../CommandExecutor';

export interface Dispatcher {
  addExecutor(executor: CommandExecutor): void,
  start(): void,
  pause(): void,
}

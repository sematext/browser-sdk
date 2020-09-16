/* @flow */
import type { Command, CommandContext } from './types';
import { informOnRouteChangeListeners } from '../pageload';

class RouteChangeCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  supported() {
    const { scope } = this.context;
    return scope.performance && scope.performance.timing;
  }

  /**
   * Route change means that the developer is giving us a hint that the Single
   * Page App has navigated to a different route. The goal now is to collect
   * all related network resources that were loaded as a side-effect of
   * navigating to this route.
   */
  execute(args: Array<any>) {
    if (typeof args[0] !== 'string') {
      throw new Error('command requires one argument: pathname');
    }

    if (!this.supported()) {
      return;
    }

    informOnRouteChangeListeners(args[0], this.context);
  }
}

export default RouteChangeCommand;

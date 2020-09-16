/* @flow */

import type { CommandContext } from '../commands';

export type RouteChangeListener = {
  onRouteChange: (pathname: string, context: CommandContext) => void,
}

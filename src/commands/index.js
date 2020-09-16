/* @flow */
import ConfigCommand from './ConfigCommand';
import PageLoadCommand from './PageLoadCommand';
import AjaxCommand from './AjaxCommand';
import IdentifyCommand from './IdentifyCommand';
import RouteChangeCommand from './RouteChangeCommand';
import VitalMetricCommand from './VitalMetricCommmand';
import { StartTransactionCommand, EndTransactionCommand } from './transactions';
import type {
  CommandContext,
  Command,
} from './types';
import LongTaskCommand from './LongTaskCommand';
import ElementTimingCommand from './ElementTimingCommand';

const commands = {
  config: ConfigCommand,
  pageLoad: PageLoadCommand,
  ajax: AjaxCommand,
  startTransaction: StartTransactionCommand,
  endTransaction: EndTransactionCommand,
  identify: IdentifyCommand,
  routeChange: RouteChangeCommand,
  longTask: LongTaskCommand,
  elementTiming: ElementTimingCommand,
  'vital-metric': VitalMetricCommand,
};

export type CommandType = $Keys<typeof commands>;

export type {
  CommandContext,
  Command,
};

export default commands;

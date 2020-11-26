/* @flow */
import ConfigCommand from './ConfigCommand';
import PageLoadCommand from './PageLoadCommand';
import AjaxCommand from './AjaxCommand';
import IdentifyCommand from './IdentifyCommand';
import RouteChangeCommand from './RouteChangeCommand';
import VitalMetricCommand from './VitalMetricCommmand';
import { RecordTransactionCommand, StartTransactionCommand, EndTransactionCommand } from './transactions';
import type {
  CommandContext,
  Command,
} from './types';
import LongTaskCommand from './LongTaskCommand';
import ElementTimingCommand from './ElementTimingCommand';
import MemoryUsageCommand from './MemoryUsageCommand';

const commands = {
  config: ConfigCommand,
  pageLoad: PageLoadCommand,
  ajax: AjaxCommand,
  startTransaction: StartTransactionCommand,
  endTransaction: EndTransactionCommand,
  recordTransaction: RecordTransactionCommand,
  identify: IdentifyCommand,
  routeChange: RouteChangeCommand,
  longTask: LongTaskCommand,
  elementTiming: ElementTimingCommand,
  vitalMetric: VitalMetricCommand,
  memoryUsage: MemoryUsageCommand,
};

export type CommandType = $Keys<typeof commands>;

export type {
  CommandContext,
  Command,
};

export default commands;

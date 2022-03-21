import { isFunction } from 'lodash-es';

import { inject, injectable } from 'extension/common/di';
import { getEnumNumberName } from 'extension/common/enum.utils';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { LogDataRepository, LogDataRepositoryToken } from 'extension/common/log/data/log-data.repository';
import { LogLevel } from 'extension/common/log/log-level.enum';
import { Logger, LoggerCaller, LoggerData, LoggerLabel } from 'extension/common/log/logger';

export const LogServiceToken = Symbol('LogService');

@injectable()
export class LogService {
  readonly rootLogger: Logger;

  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(LogDataRepositoryToken) private readonly repository: LogDataRepository,
  ) {
    this.rootLogger = this.createLogger('ROOT');
  }

  createLogger(name: string): Logger {
    return new LoggerImpl(name, this.extensionInfo, this.repository);
  }
}

class LoggerImpl implements Logger {
  constructor(
    readonly name: string,
    private readonly extensionInfo: ExtensionInfo,
    private readonly repository: LogDataRepository,
  ) {}

  count(...labels: LoggerLabel[]) {
    this.countAndAwait(...labels);
  }

  countAndAwait(...labels: LoggerLabel[]): Promise<void> {
    return this.callLogFunction(console.count.bind(console), LogLevel.Debug, false, false, labels);
  }

  countReset(...labels: LoggerLabel[]) {
    this.countResetAndAwait(...labels);
  }

  countResetAndAwait(...labels: LoggerLabel[]): Promise<void> {
    return this.callLogFunction(console.countReset.bind(console), LogLevel.Debug, false, false, labels);
  }

  debug(...data: LoggerData[]) {
    this.debugAndAwait(...data);
  }

  debugAndAwait(...data: LoggerData[]): Promise<void> {
    return this.callLogFunction(console.log.bind(console), LogLevel.Debug, true, true, data);
  }

  dir(...data: LoggerData[]) {
    this.dirAndAwait(...data);
  }

  dirAndAwait(...data: LoggerData[]): Promise<void> {
    return this.callLogFunction(console.dir.bind(console), LogLevel.Debug, true, true, data);
  }

  error(...data: LoggerData[]) {
    this.errorAndAwait(...data);
  }

  errorAndAwait(...data: LoggerData[]): Promise<void> {
    return this.callLogFunction(console.error.bind(console), LogLevel.Error, true, true, data);
  }

  info(...data: LoggerData[]) {
    this.infoAndAwait(...data);
  }

  infoAndAwait(...data: LoggerData[]): Promise<void> {
    return this.callLogFunction(console.log.bind(console), LogLevel.Info, true, true, data);
  }

  printStackTrace(caller: LoggerCaller = this.printStackTrace) {
    this.printStackTraceAndAwait(caller);
  }

  printStackTraceAndAwait(caller: LoggerCaller = this.printStackTraceAndAwait): Promise<void> {
    return this.callLogFunction(console.log.bind(console), LogLevel.Trace, true, true, [
      () => LoggerImpl.getStackTrace(caller),
    ]);
  }

  time(...labels: LoggerLabel[]) {
    this.timeAndAwait(...labels);
  }

  timeAndAwait(...labels: LoggerLabel[]): Promise<void> {
    return this.callLogFunction(console.time.bind(console), LogLevel.Debug, false, false, labels);
  }

  timeEnd(...labels: LoggerLabel[]) {
    this.timeEndAndAwait(...labels);
  }

  timeEndAndAwait(...labels: LoggerLabel[]): Promise<void> {
    return this.callLogFunction(console.timeEnd.bind(console), LogLevel.Debug, false, false, labels);
  }

  trace(...data: LoggerData[]) {
    this.traceAndAwait(...data);
  }

  traceAndAwait(...data: LoggerData[]): Promise<void> {
    return this.callLogFunction(console.log.bind(console), LogLevel.Trace, true, true, data);
  }

  warn(...data: LoggerData[]) {
    this.warnAndAwait(...data);
  }

  warnAndAwait(...data: LoggerData[]): Promise<void> {
    return this.callLogFunction(console.warn.bind(console), LogLevel.Warn, true, true, data);
  }

  private async callLogFunction(
    fn: (...args: any[]) => void,
    level: LogLevel,
    includePrefix: boolean,
    singleCall: boolean,
    args: LoggerData[] | LoggerLabel[],
  ): Promise<void> {
    try {
      if (!(await this.isLevelEnabled(level))) {
        return;
      }
    } catch (e) {
      console.error('Could not retrieve log settings:', e);
      return;
    }

    if (args.length) {
      if (singleCall) {
        const argValues = args.map((arg) => (isFunction(arg) ? arg() : arg));

        fn(...(includePrefix ? [this.getPrefix(level)].concat(argValues) : argValues));
      } else {
        args.forEach((arg) => {
          const argValue = isFunction(arg) ? arg() : arg;

          if (includePrefix && LoggerImpl.isPrefixApplicable(argValue)) {
            fn(`${this.getPrefix(level)} ${argValue}`);
          } else {
            fn(argValue);
          }
        });
      }
    } else if (includePrefix) {
      fn(this.getPrefix(level));
    } else {
      fn();
    }
  }

  private getPrefix(level: LogLevel): string {
    const extensionId = this.extensionInfo.currentId;
    const levelName = getEnumNumberName(LogLevel, level).toUpperCase();
    const timestamp = new Date().toISOString();

    return `${timestamp} ${levelName} [${extensionId} - ${this.name}]`;
  }

  private static getStackTrace(caller: LoggerCaller = LoggerImpl.getStackTrace): string {
    const error = new Error();
    Error.captureStackTrace(error, caller);

    return error.stack?.replace(/^Error/, 'Trace') || '';
  }

  private async isLevelEnabled(level: LogLevel): Promise<boolean> {
    const data = await this.repository.get();
    return data && data.enabled && level >= data.level;
  }

  private static isPrefixApplicable(arg: any): boolean {
    switch (typeof arg) {
      case 'boolean':
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'object':
        return arg === null;
      default:
        return false;
    }
  }
}

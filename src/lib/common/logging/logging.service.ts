import { inject, injectable, optional } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ConsoleLogger } from 'extension/common/logging/console.logger';
import { LoggingData } from 'extension/common/logging/data/logging-data.model';
import {
  LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { Logger } from 'extension/common/logging/logger';

export const LoggingServiceToken = Symbol('LoggingService');

@injectable()
export class LoggingService {
  private readonly data: LoggingData;
  readonly rootLogger: Logger;

  constructor(
    @inject(ExtensionInfoToken) @optional() extensionInfo: ExtensionInfo | undefined,
    @inject(LoggingDataRepositoryToken) @optional() repository: LoggingDataRepository | undefined,
  ) {
    const isProduction = extensionInfo?.isProduction ?? true;

    this.data = {
      enabled: true,
      level: isProduction ? LogLevel.Debug : LogLevel.Trace,
    };
    this.rootLogger = this.createLogger('Root');

    repository?.getOptional().then((data) => Object.assign(this.data, data));
    repository?.addChangeListener(({ newValue }) => Object.assign(this.data, newValue));
  }

  createLogger(name: string): Logger {
    return new ConsoleLogger(name, this);
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.data.enabled && level >= this.data.level;
  }
}

import { inject, injectable, optional } from 'extension/common/di';
import { type ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ConsoleLogger } from 'extension/common/logging/console.logger';
import { type LoggingDataRepository } from 'extension/common/logging/data/logging-data.repository';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type Logger } from 'extension/common/logging/logger';
import { getOrInsertComputed } from 'extension/common/map.utils';

export const LoggingServiceToken = Symbol('LoggingService');

/**
 * Sits at the very bottom of the dependency graph, as almost every other service depends on it for logging.
 *
 * As a result, it deliberately does *not* inject {@link LoggingDataRepository}, which would otherwise introduce a
 * circular dependency (`LoggingService` -> `LoggingDataRepository` -> `DataService` -> `LoggingService`) that
 * `inversify` rejects at resolution time. The persisted configuration is instead pushed in via {@link configure}
 * during bootstrap (see `configureLoggingService`).
 */
@injectable()
export class LoggingService {
  private static ROOT_LOGGER_NAME = 'ROOT';

  private readonly data: LoggingData;
  private readonly namedLoggers = new Map<string, Logger>();

  constructor(@inject(ExtensionInfoToken) @optional() extensionInfo: ExtensionInfo | undefined) {
    const isProduction = extensionInfo?.isProduction ?? true;

    this.data = {
      enabled: true,
      level: isProduction ? LogLevel.Debug : LogLevel.Trace,
    };
  }

  /**
   * Applies the persisted logging configuration and keeps it up-to-date as it changes.
   *
   * Loggers read the configuration when they log, so any logger already created picks this up immediately.
   */
  configure(repository: LoggingDataRepository): void {
    repository.getOptional().then((data) => Object.assign(this.data, data));
    repository.addChangeListener(({ newValue }) => Object.assign(this.data, newValue));
  }

  getLogger(name: string): Logger {
    return getOrInsertComputed(this.namedLoggers, name, () => new ConsoleLogger(name, this));
  }

  getRootLogger(): Logger {
    return this.getLogger(LoggingService.ROOT_LOGGER_NAME);
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.data.enabled && level >= this.data.level;
  }
}

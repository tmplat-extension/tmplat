import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { isEnumNumberValue } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import {
  LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { isBoolean, isPlainObject } from 'extension/common/type.utils';

@injectable()
export class LoggingDataMigrator extends AbstractDataMigrator {
  protected readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(LoggingDataRepositoryToken) repository: LoggingDataRepository,
  ) {
    super(DataNamespace.Logging, 'data_namespace_logging', intl, [
      AbstractDataMigrator.createSimpleStepForTransfer(
        ExtensionVersion.V1_2_9,
        'data_namespace_logging_migration_step_1',
        'logger',
        repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData)) {
            // TODO: Should this be ignored as was previously false by default and is now true by default? Might be useful for migrations
            if (isBoolean(legacyData.enabled)) {
              data.enabled = legacyData.enabled;
            }
            // TODO: Refactor to be less confusing
            if (isEnumNumberValue(LogLevel, legacyData.level)) {
              data.level = this.migrateLogLevelFromV1(legacyData.level);
            }
          }
        },
      ),
    ]);

    this.logger = loggingService.createLogger('LoggingDataMigrator');
  }

  private migrateLogLevelFromV1(legacyLogLevel: LogLevel): LogLevel {
    // TODO: Refactor to be less confusing
    switch (legacyLogLevel) {
      case LogLevel.Debug:
        return LogLevel.Info;
      case LogLevel.Info:
        return LogLevel.Debug;
      default:
        return legacyLogLevel;
    }
  }
}

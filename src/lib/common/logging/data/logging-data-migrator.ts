import { isBoolean, isPlainObject } from 'es-toolkit';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { isEnumNumberValue } from 'extension/common/enum.utils';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import {
  type LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

@injectable()
export class LoggingDataMigrator extends AbstractDataMigrator {
  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(LoggingDataRepositoryToken) private readonly repository: LoggingDataRepository,
  ) {
    super({
      intl,
      logger: logging.getLogger('LoggingDataMigrator'),
      namespace: DataNamespace.Logging,
    });
  }

  protected getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return [
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_logging_migration_step_1',
        'logger',
        this.repository,
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
    ];
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

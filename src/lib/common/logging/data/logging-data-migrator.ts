import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LegacyLoggerDataSchema } from 'extension/common/logging/data/legacy-logging-data.schema';
import {
  type LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

const remappedLogLevelsFromV1: { [key in LogLevel]?: LogLevel } = {
  [LogLevel.Debug]: LogLevel.Info,
  [LogLevel.Info]: LogLevel.Debug,
};

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
        { key: 'logger', schema: LegacyLoggerDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          // Ignoring enabled as it was previously false by default and is now true by default, which is more useful for
          // migrations
          if (legacyData.level !== undefined) {
            data.level = remappedLogLevelsFromV1[legacyData.level] ?? legacyData.level;
          }
        },
      ),
    ];
  }
}

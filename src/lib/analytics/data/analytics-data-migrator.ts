import { isBoolean } from 'es-toolkit';
import {
  type AnalyticsDataRepository,
  AnalyticsDataRepositoryToken,
} from 'extension/analytics/data/analytics-data.repository';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

const AnalyticsDataMigratorName = 'AnalyticsDataMigrator';

@injectable()
export class AnalyticsDataMigrator extends AbstractDataMigrator {
  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(AnalyticsDataRepositoryToken) private readonly repository: AnalyticsDataRepository,
  ) {
    super({
      intl,
      logger: logging.getLogger(AnalyticsDataMigratorName),
      namespace: DataNamespace.Analytics,
    });
  }

  protected getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return [
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_analytics_migration_step_1',
        'analytics',
        this.repository,
        (data, legacyData) => {
          if (isBoolean(legacyData)) {
            data.enabled = legacyData;
          }
        },
      ),
    ];
  }
}

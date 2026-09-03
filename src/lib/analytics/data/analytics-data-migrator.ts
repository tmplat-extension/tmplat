import {
  AnalyticsDataRepository,
  AnalyticsDataRepositoryToken,
} from 'extension/analytics/data/analytics-data.repository';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { isBoolean } from 'extension/common/type.utils';

@injectable()
export class AnalyticsDataMigrator extends AbstractDataMigrator {
  protected readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(AnalyticsDataRepositoryToken) repository: AnalyticsDataRepository,
  ) {
    super(DataNamespace.Analytics, 'data_namespace_analytics', intl, [
      AbstractDataMigrator.createSimpleStepForTransfer(
        ExtensionVersion.V1_2_9,
        'data_namespace_analytics_migration_step_1',
        'analytics',
        repository,
        (data, legacyData) => {
          if (isBoolean(legacyData)) {
            data.enabled = legacyData;
          }
        },
      ),
    ]);

    this.logger = loggingService.createLogger('AnalyticsDataMigrator');
  }
}

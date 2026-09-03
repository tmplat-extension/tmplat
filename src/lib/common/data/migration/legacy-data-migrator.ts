import { inject } from 'inversify';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

@injectable()
export class LegacyDataMigrator extends AbstractDataMigrator {
  protected readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
  ) {
    super(DataNamespace.Legacy, 'data_namespace_legacy', intl, [
      AbstractDataMigrator.createSimpleStepForRemoval(
        ExtensionVersion.V1_2_9,
        'data_namespace_legacy_migration_step_1',
        ['options_active_tab', 'options_limit', 'stats', 'updates'],
      ),
    ]);

    this.logger = loggingService.createLogger('LegacyDataMigrator');
  }
}

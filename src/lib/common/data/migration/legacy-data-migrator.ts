import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

@injectable()
export class LegacyDataMigrator extends AbstractDataMigrator {
  constructor(@inject(IntlServiceToken) intl: IntlService, @inject(LoggingServiceToken) logging: LoggingService) {
    super({
      intl,
      logger: logging.getLogger('LegacyDataMigrator'),
      namespace: DataNamespace.Legacy,
    });
  }

  protected getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return [
      builder.createSimpleStepForRemoval('1.2.9', 'data_namespace_legacy_migration_step_1', [
        'options_active_tab',
        'options_limit',
        'stats',
        'updates',
      ]),
    ];
  }
}

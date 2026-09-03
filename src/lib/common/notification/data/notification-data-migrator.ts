import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { LegacyNotificationDataSchema } from 'extension/common/notification/data/legacy-notification-data.schema';
import {
  type NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';

@injectable()
export class NotificationDataMigrator extends AbstractDataMigrator {
  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(NotificationDataRepositoryToken) private readonly repository: NotificationDataRepository,
  ) {
    super({
      intl,
      logger: logging.getLogger('NotificationDataMigrator'),
      namespace: DataNamespace.Notification,
    });
  }

  protected getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return [
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'migrate_namespace_notification_migration_step_1',
        { key: 'notifications', schema: LegacyNotificationDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.enabled !== undefined) {
            data.enabled = legacyData.enabled;
          }
        },
      ),
    ];
  }
}

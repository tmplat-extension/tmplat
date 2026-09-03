import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { isBoolean, isPlainObject } from 'extension/common/type.utils';

@injectable()
export class NotificationDataMigrator extends AbstractDataMigrator {
  protected readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(NotificationDataRepositoryToken) repository: NotificationDataRepository,
  ) {
    super(DataNamespace.Notification, 'data_namespace_notification', intl, [
      AbstractDataMigrator.createSimpleStepForTransfer(
        ExtensionVersion.V1_2_9,
        'data_namespace_notification_migration_step_1',
        'notifications',
        repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData) && isBoolean(legacyData.enabled)) {
            data.enabled = legacyData.enabled;
          }
        },
      ),
    ]);

    this.logger = loggingService.createLogger('NotificationDataMigrator');
  }
}

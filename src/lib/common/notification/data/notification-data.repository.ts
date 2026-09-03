import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  type NotificationData,
  NotificationDataSchema,
} from 'extension/common/notification/data/notification-data.schema';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { VersionSegment } from 'extension/common/version/version-segment.enum';

const NotificationDataRepositoryName = 'NotificationDataRepository';

export const NotificationDataRepositoryToken = Symbol(NotificationDataRepositoryName);

@injectable()
export class NotificationDataRepository
  extends RequiredDataRepository<typeof NotificationDataSchema, NotificationData>
  implements DataInstaller
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    super({
      dataStorage: dataService.sync,
      logger: logging.getLogger(NotificationDataRepositoryName),
      namespace: DataNamespace.Notification,
      schema: NotificationDataSchema,
      validationService,
    });
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      changelog: {
        enabled: true,
        scope: VersionSegment.Minor,
      },
      enabled: true,
    }));
  }
}

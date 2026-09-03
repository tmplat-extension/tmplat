import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { NotificationData } from 'extension/common/notification/data/notification-data.model';
import { notificationDataSchema } from 'extension/common/notification/data/notification-data.schema';
import { VersionSegment } from 'extension/common/version/version-segment.enum';

export const NotificationDataRepositoryToken = Symbol('NotificationDataRepository');

@injectable()
export class NotificationDataRepository extends RequiredDataRepository<NotificationData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Notification, notificationDataSchema, dataService.sync);
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      changeLog: {
        enabled: true,
        scope: VersionSegment.Minor,
      },
      enabled: true,
    }));
  }
}

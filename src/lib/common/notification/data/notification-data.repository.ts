import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { NotificationData } from 'extension/common/notification/data/notification-data.model';
import { notificationDataSchema } from 'extension/common/notification/data/notification-data.schema';
import { VersionSegment } from 'extension/common/version/version-segment.enum';

export const NotificationDataRepositoryToken = Symbol('NotificationDataRepository');

@injectable()
export class NotificationDataRepository extends DataRepository<NotificationData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Notification, notificationDataSchema, dataService.sync);
  }

  install(): Promise<void> {
    return this.set({
      changeLog: {
        enabled: true,
        scope: VersionSegment.Minor,
      },
      enabled: true,
    });
  }

  isInstalled(): Promise<boolean> {
    return this.isNotEmpty();
  }
}

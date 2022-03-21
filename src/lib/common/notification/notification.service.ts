import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { NotificationData } from 'extension/common/notification/data/notification-data.model';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { Notification } from 'extension/common/notification/notification.model';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { isVersionDiffScopeWithin } from 'extension/common/version/version.utils';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';

export const NotificationServiceToken = Symbol('NotificationService');

@injectable()
export class NotificationService {
  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(NotificationDataRepositoryToken) private readonly repository: NotificationDataRepository,
    @inject(TabServiceToken) private readonly tableService: TabService,
  ) {}

  async createNotification(notification: Notification): Promise<string | undefined> {
    const { enabled } = await this.getData();
    if (!enabled) {
      return;
    }

    return new Promise((resolve, reject) => {
      chrome.notifications.create(
        '',
        {
          iconUrl: this.extensionInfo.createExtensionUrlString('images/icon_64.png'),
          message: notification.message ?? '',
          title: notification.title ?? '',
          type: 'basic',
        },
        (notificationId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(notificationId);
          }
        },
      );
    });
  }

  async notifyChangeLog(version: ExtensionVersion, versionDiffScope: VersionSegment | null): Promise<void> {
    const { changeLog } = await this.getData();
    if (!(changeLog.enabled && isVersionDiffScopeWithin(versionDiffScope, changeLog.scope))) {
      return;
    }

    // TODO: Open tab containing change log
  }

  private getData(): Promise<NotificationData> {
    return this.repository.get();
  }
}

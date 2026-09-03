import { ChangelogPagePath } from 'extension/common/changelog/changelog.service';
import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { Notification } from 'extension/common/notification/notification.model';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { isVersionDiffScopeWithin } from 'extension/common/version/version.utils';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';

const NotificationServiceName = 'NotificationService';

/**
 * Fixed identifier so that the change log notification can still be recognised when clicked, even after the
 * service worker has been restarted. Creating another change log notification simply replaces any existing one.
 */
const ChangeLogNotificationId = 'change-log';

export const NotificationServiceToken = Symbol(NotificationServiceName);

@injectable()
export class NotificationService {
  private readonly logger: Logger;

  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(NotificationDataRepositoryToken) private readonly repository: NotificationDataRepository,
    @inject(TabServiceToken) private readonly tabService: TabService,
  ) {
    this.logger = loggingService.createLogger(NotificationServiceName);
  }

  async createNotification(notification: Notification): Promise<string | undefined> {
    const { enabled } = await this.repository.get();
    if (!enabled) {
      return;
    }

    const options: browser.notifications.NotificationCreateOptions = {
      iconUrl: this.extensionInfo.createExtensionUrlString('img/icon_64.png'),
      message: notification.message ?? '',
      title: notification.title ?? '',
      type: 'basic',
    };

    return notification.id
      ? browser.notifications.create(notification.id, options)
      : browser.notifications.create(options);
  }

  listen() {
    browser.notifications.onClicked.addListener((notificationId) => {
      this.onClicked(notificationId).catch((error) => {
        this.logger.error('Failed to handle notification click event', error);
      });
    });
  }

  async notifyChangeLog(version: ExtensionVersion, versionDiffScope: VersionSegment | null): Promise<void> {
    const { changeLog } = await this.repository.get();
    if (!(changeLog.enabled && isVersionDiffScopeWithin(versionDiffScope, changeLog.scope))) {
      return;
    }

    await this.createNotification({
      id: ChangeLogNotificationId,
      message: this.intl.getMessage('notification_change_log_message', version),
      title: this.intl.getMessage('notification_change_log_title', this.intl.getMessage('name')),
    });
  }

  private async onClicked(notificationId: string): Promise<void> {
    if (notificationId !== ChangeLogNotificationId) {
      return;
    }

    await browser.notifications.clear(notificationId);
    await this.tabService.createExtensionTab(ChangelogPagePath);
  }
}

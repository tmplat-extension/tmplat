import { ChangelogPagePath } from 'extension/common/changelog/changelog.service';
import { inject, injectable } from 'extension/common/di';
import { type ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  type NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { type Notification } from 'extension/common/notification/notification.model';
import { type VersionSegment } from 'extension/common/version/version-segment.enum';
import { isVersionDiffScopeWithin } from 'extension/common/version/version.utils';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';

const NotificationServiceName = 'NotificationService';

/**
 * Fixed identifier so that the change log notification can still be recognised when clicked, even after the
 * service worker has been restarted. Creating another change log notification simply replaces any existing one.
 */
const ChangelogNotificationId = 'changelog';

export const NotificationServiceToken = Symbol(NotificationServiceName);

@injectable()
export class NotificationService {
  private readonly logger: Logger;

  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(NotificationDataRepositoryToken) private readonly repository: NotificationDataRepository,
    @inject(TabServiceToken) private readonly tabService: TabService,
  ) {
    this.logger = logging.getLogger(NotificationServiceName);
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
    const { changelog } = await this.repository.get();
    if (!(changelog.enabled && isVersionDiffScopeWithin(versionDiffScope, changelog.scope))) {
      return;
    }

    await this.createNotification({
      id: ChangelogNotificationId,
      message: this.intl.getMessage('notification_change_log_message', version),
      title: this.intl.getMessage('notification_change_log_title', this.intl.getMessage('name')),
    });
  }

  private async onClicked(notificationId: string): Promise<void> {
    if (notificationId !== ChangelogNotificationId) {
      return;
    }

    await browser.notifications.clear(notificationId);
    await this.tabService.createExtensionTab(ChangelogPagePath);
  }
}

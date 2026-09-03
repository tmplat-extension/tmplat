import { ChangelogPagePath } from 'extension/common/changelog/changelog.service';
import { inject, injectable } from 'extension/common/di';
import { type ErrorDetailFallback, resolveErrorDetail } from 'extension/common/error/error-detail';
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
      // Only included when populated, as Chrome reserves a line for the context message even when it is blank
      ...(notification.contextMessage ? { contextMessage: notification.contextMessage } : {}),
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

  /**
   * Creates a notification describing `error`, mirroring how the error snackbar presents the same failure in the
   * extension's pages: the localized message as the body and the error code beneath it.
   *
   * Only an {@link ExtensionError} can describe itself, so `options` supplies the code, message and substitutions to
   * fall back on for anything else (see {@link resolveErrorDetail}).
   *
   * This never rejects. It is called from `catch` blocks that are about to rethrow, and a failure to report a problem
   * must not replace the problem being reported, so it is logged and swallowed instead.
   */
  async notifyError(error: unknown, options: NotifyErrorOptions): Promise<string | undefined> {
    const detail = resolveErrorDetail(error, this.intl, options);
    const notification: Notification = {
      contextMessage: detail.code,
      id: options.id,
      message: detail.message,
      title: options.title ?? this.intl.getMessage('error'),
    };

    try {
      return await this.createNotification(notification);
    } catch (e) {
      this.logger.error('Failed to create error notification', e, { notification });
      return undefined;
    }
  }

  private async onClicked(notificationId: string): Promise<void> {
    if (notificationId !== ChangelogNotificationId) {
      return;
    }

    await browser.notifications.clear(notificationId);
    await this.tabService.createExtensionTab(ChangelogPagePath);
  }
}

export type NotifyErrorOptions = ErrorDetailFallback & {
  id?: string;
  title?: string;
};

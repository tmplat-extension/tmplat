import { allFulfilled } from 'allfulfilled';
import {
  type AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { inject, injectable } from 'extension/common/di';
import { firstError } from 'extension/common/error/reason.utils';
import {
  type LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  type NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { type Settings } from 'extension/common/settings/settings.model';
import {
  type TemplateDataRepository,
  TemplateDataRepositoryToken,
} from 'extension/template/data/template-data.repository';
import {
  type UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';

export const SettingsServiceToken = Symbol('SettingsService');

/**
 * Provides read/write access to all user-configurable settings spread across the various data namespaces, allowing
 * them to be presented (and saved) as a single unit by the options UI.
 */
@injectable()
export class SettingsService {
  private readonly logger: Logger;

  constructor(
    @inject(AppearanceDataRepositoryToken) private readonly appearanceRepository: AppearanceDataRepository,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(LoggingDataRepositoryToken) private readonly loggingRepository: LoggingDataRepository,
    @inject(NotificationDataRepositoryToken) private readonly notificationRepository: NotificationDataRepository,
    @inject(TemplateDataRepositoryToken) private readonly templateRepository: TemplateDataRepository,
    @inject(UrlShortenerDataRepositoryToken) private readonly urlShortenerRepository: UrlShortenerDataRepository,
  ) {
    this.logger = logging.getLogger('SettingsService');
  }

  async getSettings(): Promise<Settings> {
    const [appearance, logging, notification, template, urlShortener] = await allFulfilled(
      [
        this.appearanceRepository.get(),
        this.loggingRepository.get(),
        this.notificationRepository.get(),
        this.templateRepository.get(),
        this.urlShortenerRepository.get(),
      ],
      // The options UI renders this rejection via `useErrorDetail`, which can only surface a specific message for an
      // `ExtensionError`, so the reason must not be wrapped in an `AggregateError`.
      firstError(this.logger, 'Failed to read one or more settings namespaces'),
    );

    return structuredClone({
      appearance: {
        mode: appearance.mode,
      },
      general: {
        action: template.action,
        contextMenu: template.contextMenu,
        link: template.link,
        markdown: template.markdown,
        shortcuts: template.shortcuts,
      },
      logging: {
        enabled: logging.enabled,
        level: logging.level,
      },
      notification: {
        changelog: notification.changelog,
        enabled: notification.enabled,
      },
      urlShortener: {
        provider: urlShortener.provider,
        providers: urlShortener.providers,
      },
    });
  }

  async saveSettings(settings: Readonly<Settings>): Promise<void> {
    const { appearance, general, logging, notification, urlShortener } = structuredClone(settings) as Settings;

    await allFulfilled(
      [
        this.appearanceRepository.mutate((data) => ({
          ...data,
          mode: appearance.mode,
        })),
        this.loggingRepository.mutate((data) => ({
          ...data,
          enabled: logging.enabled,
          level: logging.level,
        })),
        this.notificationRepository.mutate((data) => ({
          ...data,
          changelog: notification.changelog,
          enabled: notification.enabled,
        })),
        this.templateRepository.mutate((data) => ({
          ...data,
          action: general.action,
          contextMenu: general.contextMenu,
          link: general.link,
          markdown: general.markdown,
          shortcuts: general.shortcuts,
        })),
        this.urlShortenerRepository.mutate((data) => ({
          ...data,
          provider: urlShortener.provider,
          providers: {
            dagd: { ...data.providers.dagd },
            spoome: { ...data.providers.spoome },
            yourls: {
              ...urlShortener.providers.yourls,
              password: SettingsService.normalize(urlShortener.providers.yourls.password),
              signature: SettingsService.normalize(urlShortener.providers.yourls.signature),
              url: SettingsService.normalize(urlShortener.providers.yourls.url),
              username: SettingsService.normalize(urlShortener.providers.yourls.username),
            },
          },
        })),
      ],
      // A failed save is rendered by the options UI via `useErrorDetail`, which can only surface a specific
      // message for an `ExtensionError`, so the reason must not be wrapped in an `AggregateError`.
      firstError(this.logger, 'Failed to write one or more settings namespaces'),
    );
  }

  /**
   * Data schemas only accept non-empty strings or `null`, however, it's much simpler for the UI to deal with empty
   * strings.
   */
  private static normalize(value: string | null): string | null {
    return value?.trim() || null;
  }
}

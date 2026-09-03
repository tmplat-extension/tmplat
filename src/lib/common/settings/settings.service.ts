import _cloneDeep from 'lodash.clonedeep';
import {
  AnalyticsDataRepository,
  AnalyticsDataRepositoryToken,
} from 'extension/analytics/data/analytics-data.repository';
import {
  AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { inject, injectable } from 'extension/common/di';
import {
  LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { Settings } from 'extension/common/settings/settings.model';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';

export const SettingsServiceToken = Symbol('SettingsService');

/**
 * Provides read/write access to all user-configurable settings spread across the various data namespaces, allowing
 * them to be presented (and saved) as a single unit by the options UI.
 */
@injectable()
export class SettingsService {
  constructor(
    @inject(AnalyticsDataRepositoryToken) private readonly analyticsRepository: AnalyticsDataRepository,
    @inject(AppearanceDataRepositoryToken) private readonly appearanceRepository: AppearanceDataRepository,
    @inject(LoggingDataRepositoryToken) private readonly loggingRepository: LoggingDataRepository,
    @inject(NotificationDataRepositoryToken) private readonly notificationRepository: NotificationDataRepository,
    @inject(OAuthDataRepositoryToken) private readonly oauthRepository: OAuthDataRepository,
    @inject(TemplateDataRepositoryToken) private readonly templateRepository: TemplateDataRepository,
    @inject(UrlShortenerDataRepositoryToken) private readonly urlShortenerRepository: UrlShortenerDataRepository,
  ) {}

  async getSettings(): Promise<Settings> {
    const [analytics, appearance, logging, notification, oauth, template, urlShortener] = await Promise.all([
      this.analyticsRepository.get(),
      this.appearanceRepository.get(),
      this.loggingRepository.get(),
      this.notificationRepository.get(),
      this.oauthRepository.get(),
      this.templateRepository.get(),
      this.urlShortenerRepository.get(),
    ]);

    return _cloneDeep({
      analytics: {
        enabled: analytics.enabled,
      },
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
        changeLog: notification.changeLog,
        enabled: notification.enabled,
      },
      oauth: {
        providers: oauth.providers,
      },
      urlShortener: {
        provider: urlShortener.provider,
        providers: urlShortener.providers,
      },
    });
  }

  async saveSettings(settings: Readonly<Settings>): Promise<void> {
    const { analytics, appearance, general, logging, notification, oauth, urlShortener } = _cloneDeep(
      settings,
    ) as Settings;

    await Promise.all([
      this.analyticsRepository.mutate((data) => ({
        ...data,
        enabled: analytics.enabled,
      })),
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
        changeLog: notification.changeLog,
        enabled: notification.enabled,
      })),
      this.oauthRepository.mutate((data) => ({
        ...data,
        providers: oauth.providers,
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
          bitly: {
            ...data.providers.bitly,
          },
          dagd: {
            ...data.providers.dagd,
          },
          spoome: {
            ...data.providers.spoome,
          },
          yourls: {
            ...urlShortener.providers.yourls,
            password: SettingsService.normalize(urlShortener.providers.yourls.password),
            signature: SettingsService.normalize(urlShortener.providers.yourls.signature),
            url: SettingsService.normalize(urlShortener.providers.yourls.url),
            username: SettingsService.normalize(urlShortener.providers.yourls.username),
          },
        },
      })),
    ]);
  }

  /**
   * Data schemas only accept non-empty strings or `null`, however, it's much simpler for the UI to deal with empty
   * strings.
   */
  private static normalize(value: string | null): string | null {
    return value?.trim() ? value.trim() : null;
  }
}

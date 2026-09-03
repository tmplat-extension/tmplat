import { AnalyticsData } from 'extension/analytics/data/analytics-data.model';
import { AppearanceData } from 'extension/common/appearance/data/appearance-data.model';
import { LoggingData } from 'extension/common/logging/data/logging-data.model';
import { NotificationData } from 'extension/common/notification/data/notification-data.model';
import { OAuthData } from 'extension/oauth/data/oauth-data.model';
import { TemplateData } from 'extension/template/data/template-data.model';
import { UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.model';

/**
 * All user-configurable settings, aggregated from each of the data namespaces that own them.
 *
 * Templates themselves are deliberately excluded as they are managed separately.
 */
export type Settings = {
  analytics: SettingsAnalytics;
  appearance: SettingsAppearance;
  general: SettingsGeneral;
  logging: SettingsLogging;
  notification: SettingsNotification;
  oauth: SettingsOAuth;
  urlShortener: SettingsUrlShortener;
};

export type SettingsAnalytics = Pick<AnalyticsData, 'enabled'>;

export type SettingsAppearance = AppearanceData;

export type SettingsGeneral = Pick<TemplateData, 'action' | 'contextMenu' | 'link' | 'markdown' | 'shortcuts'>;

export type SettingsLogging = LoggingData;

export type SettingsNotification = NotificationData;

/**
 * Connecting/disconnecting an account is only applied once settings are saved, so any pending authentication is held
 * here in the meantime.
 */
export type SettingsOAuth = OAuthData;

/**
 * Unlike other data namespaces, this is stored in local (rather than sync) storage since it may hold credentials
 * (a Bitly access token, or a YOURLS signature/username/password), and is otherwise identical to
 * {@link UrlShortenerData}.
 */
export type SettingsUrlShortener = UrlShortenerData;

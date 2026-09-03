import { type AppearanceData } from 'extension/common/appearance/data/appearance-data.schema';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { type NotificationData } from 'extension/common/notification/data/notification-data.schema';
import { type TemplateSettings } from 'extension/template/data/template-data.schema';
import { type UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.schema';

/**
 * All user-configurable settings, aggregated from each of the data namespaces that own them.
 *
 * Templates themselves are deliberately excluded as they are managed separately.
 */
export type Settings = {
  appearance: SettingsAppearance;
  general: SettingsGeneral;
  logging: SettingsLogging;
  notification: SettingsNotification;
  urlShortener: SettingsUrlShortener;
};

export type SettingsAppearance = AppearanceData;

export type SettingsGeneral = TemplateSettings;

export type SettingsLogging = LoggingData;

export type SettingsNotification = NotificationData;

/**
 * Unlike other data namespaces, this is stored in local (rather than sync) storage since it may hold credentials
 * (a YOURLS signature/username/password), and is otherwise identical to
 * {@link UrlShortenerData}.
 */
export type SettingsUrlShortener = UrlShortenerData;

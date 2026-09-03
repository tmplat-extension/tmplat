import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type MigrationData } from 'extension/common/data/migration/migration-data.schema';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { type NotificationData } from 'extension/common/notification/data/notification-data.schema';
import { type TemplateSettings } from 'extension/template/data/template-data.schema';
import { type UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.schema';

/**
 * The data namespaces exposed to a template.
 *
 * `Template` carries the settings only. The templates themselves are a separate collection of per-template keys and are
 * deliberately not loaded here, so that rendering any template does not have to read every other template's content.
 */
export type TemplateContextData = {
  readonly [DataNamespace.Legacy]: Record<string, never>;
  readonly [DataNamespace.Logging]: LoggingData;
  readonly [DataNamespace.Migration]: MigrationData;
  readonly [DataNamespace.Notification]: NotificationData;
  readonly [DataNamespace.Template]: TemplateSettings;
  readonly [DataNamespace.UrlShortener]: UrlShortenerData;
};

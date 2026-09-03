import { type AnalyticsData } from 'extension/analytics/data/analytics-data.schema';
import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type MigrationData } from 'extension/common/data/migration/migration-data.schema';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { type NotificationData } from 'extension/common/notification/data/notification-data.schema';
import { type OAuthData } from 'extension/oauth/data/oauth-data.schema';
import { type TemplateData } from 'extension/template/data/template-data.schema';
import { type UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.schema';

export type TemplateContextData = {
  readonly [DataNamespace.Analytics]: AnalyticsData;
  readonly [DataNamespace.Legacy]: Record<string, never>;
  readonly [DataNamespace.Logging]: LoggingData;
  readonly [DataNamespace.Migration]: MigrationData;
  readonly [DataNamespace.Notification]: NotificationData;
  readonly [DataNamespace.OAuth]: OAuthData;
  readonly [DataNamespace.Template]: TemplateData;
  readonly [DataNamespace.UrlShortener]: UrlShortenerData;
};

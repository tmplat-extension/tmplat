import { AnalyticsData } from 'extension/analytics/data/analytics-data.model';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { MigrationData } from 'extension/common/data/migration/migration-data.model';
import { LogData } from 'extension/common/log/data/log-data.model';
import { NotificationData } from 'extension/common/notification/data/notification-data.model';
import { OAuthData } from 'extension/oauth/data/oauth-data.model';
import { TemplateData } from 'extension/template/data/template-data.model';
import { UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.model';

export type TemplateContextData = {
  readonly [DataNamespace.Analytics]: AnalyticsData;
  readonly [DataNamespace.Common]: undefined;
  readonly [DataNamespace.Log]: LogData;
  readonly [DataNamespace.Migration]: MigrationData;
  readonly [DataNamespace.Notification]: NotificationData;
  readonly [DataNamespace.OAuth]: OAuthData;
  readonly [DataNamespace.Template]: TemplateData;
  readonly [DataNamespace.UrlShortener]: UrlShortenerData;
};

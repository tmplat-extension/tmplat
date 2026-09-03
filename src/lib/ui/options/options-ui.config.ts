import { AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import {
  AnalyticsDataRepository,
  AnalyticsDataRepositoryToken,
} from 'extension/analytics/data/analytics-data.repository';
import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import {
  AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { Container } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import {
  LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { SettingsService, SettingsServiceToken } from 'extension/common/settings/settings.service';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { BitlyOAuthProvider } from 'extension/oauth/provider/bitly-oauth.provider';
import { OAuthProvider, OAuthProviderToken } from 'extension/oauth/provider/oauth.provider';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import { OptionsUi } from 'extension/ui/options/options-ui';
import { Ui, UiToken } from 'extension/ui/ui';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind<AnalyticsDataRepository>(AnalyticsDataRepositoryToken).to(AnalyticsDataRepository);
container.bind<AnalyticsService>(AnalyticsServiceToken).to(AnalyticsService);
container.bind<AppearanceDataRepository>(AppearanceDataRepositoryToken).to(AppearanceDataRepository);
container.bind<AppearanceService>(AppearanceServiceToken).to(AppearanceService);
container.bind<DataService>(DataServiceToken).to(DataService);
container.bind<ExtensionInfo>(ExtensionInfoToken).to(ExtensionInfo);
container.bind<IntlService>(IntlServiceToken).to(IntlService);
container.bind<LoggingDataRepository>(LoggingDataRepositoryToken).to(LoggingDataRepository);
container.bind<LoggingService>(LoggingServiceToken).to(LoggingService);
container.bind<MessageIdGenerator>(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind<MessageService>(MessageServiceToken).to(MessageService);
container.bind<NotificationDataRepository>(NotificationDataRepositoryToken).to(NotificationDataRepository);
container.bind<OAuthDataRepository>(OAuthDataRepositoryToken).to(OAuthDataRepository);
container.bind<OAuthProvider>(OAuthProviderToken).to(BitlyOAuthProvider);
container.bind<OAuthService>(OAuthServiceToken).to(OAuthService);
container.bind<SettingsService>(SettingsServiceToken).to(SettingsService);
container.bind<TabService>(TabServiceToken).to(TabService);
container.bind<TemplateDataRepository>(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind<TemplateService>(TemplateServiceToken).to(TemplateService);
container.bind<UrlShortenerDataRepository>(UrlShortenerDataRepositoryToken).to(UrlShortenerDataRepository);
container.bind<Ui>(UiToken).to(OptionsUi);

export { container };

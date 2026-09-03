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
import { configureLoggingService } from 'extension/common/logging/logging.bootstrap';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageConfigToken } from 'extension/common/message/message-config';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { SettingsService, SettingsServiceToken } from 'extension/common/settings/settings.service';
import { ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { BitlyOAuthProvider } from 'extension/oauth/provider/bitly-oauth.provider';
import { OAuthProviderToken } from 'extension/oauth/provider/oauth.provider';
import { TabContentMessageConfig } from 'extension/tab/message/tab-content-message-config';
import { TabContextMessageConfig } from 'extension/tab/message/tab-context-message-config';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import { OptionsUi } from 'extension/ui/options/options-ui';
import { UiToken } from 'extension/ui/ui';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind(AnalyticsDataRepositoryToken).to(AnalyticsDataRepository);
container.bind(AnalyticsServiceToken).to(AnalyticsService);
container.bind(AppearanceDataRepositoryToken).to(AppearanceDataRepository);
container.bind(AppearanceServiceToken).to(AppearanceService);
container.bind(DataServiceToken).to(DataService);
container.bind(ExtensionInfoToken).to(ExtensionInfo);
container.bind(IntlServiceToken).to(IntlService);
container.bind(LoggingDataRepositoryToken).to(LoggingDataRepository);
container.bind(LoggingServiceToken).to(LoggingService);
container.bind(MessageConfigToken).toConstantValue(TabContentMessageConfig);
container.bind(MessageConfigToken).toConstantValue(TabContextMessageConfig);
container.bind(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind(MessageServiceToken).to(MessageService);
container.bind(NotificationDataRepositoryToken).to(NotificationDataRepository);
container.bind(OAuthDataRepositoryToken).to(OAuthDataRepository);
container.bind(OAuthProviderToken).to(BitlyOAuthProvider);
container.bind(OAuthServiceToken).to(OAuthService);
container.bind(SettingsServiceToken).to(SettingsService);
container.bind(TabServiceToken).to(TabService);
container.bind(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind(TemplateServiceToken).to(TemplateService);
container.bind(UrlShortenerDataRepositoryToken).to(UrlShortenerDataRepository);
container.bind(UiToken).to(OptionsUi);
container.bind(ValidationServiceToken).to(ValidationService);

// Must happen once all bindings are registered, as `LoggingService` cannot inject the repository itself.
configureLoggingService(container);

export { container };

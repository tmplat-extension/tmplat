import { AnalyticsDataRepository } from 'extension/analytics/data/analytics-data.repository';
import { ActionService, ActionServiceToken } from 'extension/common/action/action.service';
import { AppearanceDataRepository } from 'extension/common/appearance/data/appearance-data.repository';
import { ClipboardService, ClipboardServiceToken } from 'extension/common/clipboard/clipboard.service';
import { CopyMessageConfig } from 'extension/common/clipboard/message/copy-message-config';
import { DataInstallerToken } from 'extension/common/data/data-installer';
import { DataUpdaterToken } from 'extension/common/data/data-updater';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import {
  DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import {
  MigrationDataRepository,
  MigrationDataRepositoryToken,
} from 'extension/common/data/migration/migration-data.repository';
import { Container } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ExtensionManager, ExtensionManagerToken } from 'extension/common/extension-manager';
import { GeolocationServiceToken, OffscreenGeolocationService } from 'extension/common/geolocation/geolocation.service';
import { GeolocationMessageConfig } from 'extension/common/geolocation/message/geolocation-message-config';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import {
  LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { configureLoggingService } from 'extension/common/logging/logging.bootstrap';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MarkdownServiceToken, OffscreenMarkdownService } from 'extension/common/markdown/markdown.service';
import { ConvertMarkdownMessageConfig } from 'extension/common/markdown/message/convert-markdown-message-config';
import { MessageConfigToken } from 'extension/common/message/message-config';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageListenerToken } from 'extension/common/message/message-listener';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { OffscreenService, OffscreenServiceToken } from 'extension/common/offscreen/offscreen.service';
import { ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { ContextMenuService, ContextMenuServiceToken } from 'extension/context-menu/context-menu.service';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { BitlyOAuthProvider } from 'extension/oauth/provider/bitly-oauth.provider';
import { OAuthProviderToken } from 'extension/oauth/provider/oauth.provider';
import { TabContentMessageConfig } from 'extension/tab/message/tab-content-message-config';
import { TabContextMessageConfig } from 'extension/tab/message/tab-context-message-config';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import {
  TemplateContextManagerFactory,
  TemplateContextManagerFactoryToken,
} from 'extension/template/context/template-context-manager.factory';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { ExecuteTemplateMessageConfig } from 'extension/template/message/execute-template-message-config';
import { ExecuteTemplateMessageListener } from 'extension/template/message/execute-template-message-listener';
import { TemplateEngine, TemplateEngineToken } from 'extension/template/template-engine';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import { BitlyUrlShortenerProvider } from 'extension/url-shortener/provider/bitly-url-shortener.provider';
import { DaGdUrlShortenerProvider } from 'extension/url-shortener/provider/da-gd-url-shortener.provider';
import { SpooMeUrlShortenerProvider } from 'extension/url-shortener/provider/spoo-me-url-shortener.provider';
import { UrlShortenerProviderToken } from 'extension/url-shortener/provider/url-shortener.provider';
import { YourlsUrlShortenerProvider } from 'extension/url-shortener/provider/yourls-url-shortener.provider';
import { UrlShortenerService, UrlShortenerServiceToken } from 'extension/url-shortener/url-shortener.service';
import { BackgroundWorker } from 'extension/worker/background/background-worker';
import { WorkerToken } from 'extension/worker/worker';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind(ActionServiceToken).to(ActionService);
container.bind(ClipboardServiceToken).to(ClipboardService);
container.bind(ContextMenuServiceToken).to(ContextMenuService);
container.bind(DataInstallerToken).to(AnalyticsDataRepository);
container.bind(DataInstallerToken).to(AppearanceDataRepository);
container.bind(DataInstallerToken).to(LoggingDataRepository);
container.bind(DataInstallerToken).to(MigrationDataRepository);
container.bind(DataInstallerToken).to(NotificationDataRepository);
container.bind(DataInstallerToken).to(OAuthDataRepository);
container.bind(DataInstallerToken).to(TemplateDataRepository);
container.bind(DataInstallerToken).to(UrlShortenerDataRepository);
container.bind(DataMigrationServiceToken).to(DataMigrationService);
container.bind(DataServiceToken).to(DataService);
container.bind(DataUpdaterToken).to(TemplateDataRepository);
container.bind(ExtensionInfoToken).to(ExtensionInfo);
container.bind(ExtensionManagerToken).to(ExtensionManager);
container.bind(GeolocationServiceToken).to(OffscreenGeolocationService);
container.bind(IntlServiceToken).to(IntlService);
container.bind(LoggingDataRepositoryToken).to(LoggingDataRepository);
container.bind(LoggingServiceToken).to(LoggingService);
container.bind(MarkdownServiceToken).to(OffscreenMarkdownService);
container.bind(MessageConfigToken).toConstantValue(ConvertMarkdownMessageConfig);
container.bind(MessageConfigToken).toConstantValue(CopyMessageConfig);
container.bind(MessageConfigToken).toConstantValue(ExecuteTemplateMessageConfig);
container.bind(MessageConfigToken).toConstantValue(GeolocationMessageConfig);
container.bind(MessageConfigToken).toConstantValue(TabContentMessageConfig);
container.bind(MessageConfigToken).toConstantValue(TabContextMessageConfig);
container.bind(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind(MessageListenerToken).to(ExecuteTemplateMessageListener);
container.bind(MessageServiceToken).to(MessageService);
container.bind(MigrationDataRepositoryToken).to(MigrationDataRepository);
container.bind(NotificationDataRepositoryToken).to(NotificationDataRepository);
container.bind(NotificationServiceToken).to(NotificationService);
container.bind(OAuthDataRepositoryToken).to(OAuthDataRepository);
container.bind(OAuthProviderToken).to(BitlyOAuthProvider);
container.bind(OAuthServiceToken).to(OAuthService);
container.bind(OffscreenServiceToken).to(OffscreenService);
container.bind(TabServiceToken).to(TabService);
container.bind(TemplateContextManagerFactoryToken).to(TemplateContextManagerFactory);
container.bind(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind(TemplateEngineToken).to(TemplateEngine);
container.bind(TemplateServiceToken).to(TemplateService);
container.bind(UrlShortenerDataRepositoryToken).to(UrlShortenerDataRepository);
container.bind(UrlShortenerProviderToken).to(BitlyUrlShortenerProvider);
container.bind(UrlShortenerProviderToken).to(DaGdUrlShortenerProvider);
container.bind(UrlShortenerProviderToken).to(SpooMeUrlShortenerProvider);
container.bind(UrlShortenerProviderToken).to(YourlsUrlShortenerProvider);
container.bind(UrlShortenerServiceToken).to(UrlShortenerService);
container.bind(ValidationServiceToken).to(ValidationService);
container.bind(WorkerToken).to(BackgroundWorker);

// Must happen once all bindings are registered, as `LoggingService` cannot inject the repository itself.
configureLoggingService(container);

export { container };

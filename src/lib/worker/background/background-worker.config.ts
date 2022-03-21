import { AnalyticsDataRepository } from 'extension/analytics/data/analytics-data.repository';
import { DataInstaller, DataInstallerToken } from 'extension/common/data/data-installer';
import { DataUpdater, DataUpdaterToken } from 'extension/common/data/data-updater';
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
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LogDataRepository, LogDataRepositoryToken } from 'extension/common/log/data/log-data.repository';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageListener, MessageListenerToken } from 'extension/common/message/message-listener';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { ContextMenuService, ContextMenuServiceToken } from 'extension/context-menu/context-menu.service';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { BitlyOAuthProvider } from 'extension/oauth/provider/bitly-oauth.provider';
import { OAuthProvider, OAuthProviderToken } from 'extension/oauth/provider/oauth.provider';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import {
  TemplateContextManagerFactory,
  TemplateContextManagerFactoryToken,
} from 'extension/template/context/template-context-manager.factory';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { ExecuteTemplateMessageListener } from 'extension/template/message/execute-template-message-listener';
import { TemplateEngine, TemplateEngineToken } from 'extension/template/template-engine';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import {
  UrlShortenerDataBitlyProvider,
  UrlShortenerDataYourlsProvider,
} from 'extension/url-shortener/data/url-shortener-data.model';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import { BitlyUrlShortenerProvider } from 'extension/url-shortener/provider/bitly-url-shortener.provider';
import {
  UrlShortenerProvider,
  UrlShortenerProviderToken,
} from 'extension/url-shortener/provider/url-shortener.provider';
import { YourlsUrlShortenerProvider } from 'extension/url-shortener/provider/yourls-url-shortener.provider';
import { UrlShortenerService, UrlShortenerServiceToken } from 'extension/url-shortener/url-shortener.service';
import { BackgroundWorker } from 'extension/worker/background/background-worker';
import { Worker, WorkerToken } from 'extension/worker/worker';

const container = new Container({ skipBaseClassChecks: true });
container.bind<ContextMenuService>(ContextMenuServiceToken).to(ContextMenuService);
container.bind<DataInstaller>(DataInstallerToken).to(AnalyticsDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(LogDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(NotificationDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(OAuthDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(TemplateDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(UrlShortenerDataRepository);
container.bind<DataMigrationService>(DataMigrationServiceToken).to(DataMigrationService);
container.bind<DataService>(DataServiceToken).to(DataService);
container.bind<DataUpdater>(DataUpdaterToken).to(TemplateDataRepository);
container.bind<ExtensionInfo>(ExtensionInfoToken).to(ExtensionInfo);
container.bind<ExtensionManager>(ExtensionManagerToken).to(ExtensionManager);
container.bind<IntlService>(IntlServiceToken).to(IntlService);
container.bind<LogDataRepository>(LogDataRepositoryToken).to(LogDataRepository);
container.bind<LogService>(LogServiceToken).to(LogService);
container.bind<MessageIdGenerator>(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind<MessageListener>(MessageListenerToken).to(ExecuteTemplateMessageListener);
container.bind<MessageService>(MessageServiceToken).to(MessageService);
container.bind<MigrationDataRepository>(MigrationDataRepositoryToken).to(MigrationDataRepository);
container.bind<NotificationDataRepository>(NotificationDataRepositoryToken).to(NotificationDataRepository);
container.bind<NotificationService>(NotificationServiceToken).to(NotificationService);
container.bind<OAuthDataRepository>(OAuthDataRepositoryToken).to(OAuthDataRepository);
container.bind<OAuthProvider>(OAuthProviderToken).to(BitlyOAuthProvider);
container.bind<OAuthService>(OAuthServiceToken).to(OAuthService);
container.bind<TabService>(TabServiceToken).to(TabService);
container.bind<TemplateContextManagerFactory>(TemplateContextManagerFactoryToken).to(TemplateContextManagerFactory);
container.bind<TemplateDataRepository>(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind<TemplateEngine>(TemplateEngineToken).to(TemplateEngine);
container.bind<TemplateService>(TemplateServiceToken).to(TemplateService);
container.bind<UrlShortenerDataRepository>(UrlShortenerDataRepositoryToken).to(UrlShortenerDataRepository);
container
  .bind<UrlShortenerProvider<UrlShortenerDataBitlyProvider>>(UrlShortenerProviderToken)
  .to(BitlyUrlShortenerProvider);
container
  .bind<UrlShortenerProvider<UrlShortenerDataYourlsProvider>>(UrlShortenerProviderToken)
  .to(YourlsUrlShortenerProvider);
container.bind<UrlShortenerService>(UrlShortenerServiceToken).to(UrlShortenerService);
container.bind<Worker>(WorkerToken).to(BackgroundWorker);

export { container };

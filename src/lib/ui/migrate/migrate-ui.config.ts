import { AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import { AnalyticsDataMigrator } from 'extension/analytics/data/analytics-data-migrator';
import {
  AnalyticsDataRepository,
  AnalyticsDataRepositoryToken,
} from 'extension/analytics/data/analytics-data.repository';
import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import {
  AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { DataInstaller, DataInstallerToken } from 'extension/common/data/data-installer';
import { DataUpdater, DataUpdaterToken } from 'extension/common/data/data-updater';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { LegacyDataService, LegacyDataServiceToken } from 'extension/common/data/legacy-data.service';
import {
  DataMigrationManager,
  DataMigrationManagerToken,
} from 'extension/common/data/migration/data-migration-manager';
import {
  DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import { DataMigrator, DataMigratorToken } from 'extension/common/data/migration/data-migrator';
import { LegacyDataMigrator } from 'extension/common/data/migration/legacy-data-migrator';
import {
  MigrationDataRepository,
  MigrationDataRepositoryToken,
} from 'extension/common/data/migration/migration-data.repository';
import { Container } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LoggingDataMigrator } from 'extension/common/logging/data/logging-data-migrator';
import {
  LoggingDataRepository,
  LoggingDataRepositoryToken,
} from 'extension/common/logging/data/logging-data.repository';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { NotificationDataMigrator } from 'extension/common/notification/data/notification-data-migrator';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { OAuthDataMigrator } from 'extension/oauth/data/oauth-data-migrator';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TemplateDataMigrator } from 'extension/template/data/template-data-migrator';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { MigrateUi } from 'extension/ui/migrate/migrate-ui';
import { Ui, UiToken } from 'extension/ui/ui';
import { UrlShortenerDataMigrator } from 'extension/url-shortener/data/url-shortener-data-migrator';
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
container.bind<DataInstaller>(DataInstallerToken).to(AnalyticsDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(AppearanceDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(LoggingDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(MigrationDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(NotificationDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(OAuthDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(TemplateDataRepository);
container.bind<DataInstaller>(DataInstallerToken).to(UrlShortenerDataRepository);
container.bind<DataMigrationManager>(DataMigrationManagerToken).to(DataMigrationManager);
container.bind<DataMigrationService>(DataMigrationServiceToken).to(DataMigrationService);
container.bind<DataMigrator>(DataMigratorToken).to(AnalyticsDataMigrator);
container.bind<DataMigrator>(DataMigratorToken).to(LegacyDataMigrator);
container.bind<DataMigrator>(DataMigratorToken).to(LoggingDataMigrator);
container.bind<DataMigrator>(DataMigratorToken).to(NotificationDataMigrator);
container.bind<DataMigrator>(DataMigratorToken).to(OAuthDataMigrator);
container.bind<DataMigrator>(DataMigratorToken).to(TemplateDataMigrator);
container.bind<DataMigrator>(DataMigratorToken).to(UrlShortenerDataMigrator);
container.bind<DataService>(DataServiceToken).to(DataService);
container.bind<DataUpdater>(DataUpdaterToken).to(TemplateDataRepository);
container.bind<ExtensionInfo>(ExtensionInfoToken).to(ExtensionInfo);
container.bind<IntlService>(IntlServiceToken).to(IntlService);
container.bind<LegacyDataService>(LegacyDataServiceToken).to(LegacyDataService);
container.bind<LoggingDataRepository>(LoggingDataRepositoryToken).to(LoggingDataRepository);
container.bind<LoggingService>(LoggingServiceToken).to(LoggingService);
container.bind<MessageIdGenerator>(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind<MigrationDataRepository>(MigrationDataRepositoryToken).to(MigrationDataRepository);
container.bind<NotificationDataRepository>(NotificationDataRepositoryToken).to(NotificationDataRepository);
container.bind<OAuthDataRepository>(OAuthDataRepositoryToken).to(OAuthDataRepository);
container.bind<TabService>(TabServiceToken).to(TabService);
container.bind<TemplateDataRepository>(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind<Ui>(UiToken).to(MigrateUi);
container.bind<UrlShortenerDataRepository>(UrlShortenerDataRepositoryToken).to(UrlShortenerDataRepository);

export { container };

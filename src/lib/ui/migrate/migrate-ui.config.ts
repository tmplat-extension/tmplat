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
import { DataInstallerToken } from 'extension/common/data/data-installer';
import { DataUpdaterToken } from 'extension/common/data/data-updater';
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
import { DataMigratorToken } from 'extension/common/data/migration/data-migrator';
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
import { configureLoggingService } from 'extension/common/logging/logging.bootstrap';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageConfigToken } from 'extension/common/message/message-config';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { NotificationDataMigrator } from 'extension/common/notification/data/notification-data-migrator';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';
import { ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { OAuthDataMigrator } from 'extension/oauth/data/oauth-data-migrator';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { TabContentMessageConfig } from 'extension/tab/message/tab-content-message-config';
import { TabContextMessageConfig } from 'extension/tab/message/tab-context-message-config';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TemplateDataMigrator } from 'extension/template/data/template-data-migrator';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { MigrateUi } from 'extension/ui/migrate/migrate-ui';
import { UiToken } from 'extension/ui/ui';
import { UrlShortenerDataMigrator } from 'extension/url-shortener/data/url-shortener-data-migrator';
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
container.bind(DataInstallerToken).to(AnalyticsDataRepository);
container.bind(DataInstallerToken).to(AppearanceDataRepository);
container.bind(DataInstallerToken).to(LoggingDataRepository);
container.bind(DataInstallerToken).to(MigrationDataRepository);
container.bind(DataInstallerToken).to(NotificationDataRepository);
container.bind(DataInstallerToken).to(OAuthDataRepository);
container.bind(DataInstallerToken).to(TemplateDataRepository);
container.bind(DataInstallerToken).to(UrlShortenerDataRepository);
container.bind(DataMigrationManagerToken).to(DataMigrationManager);
container.bind(DataMigrationServiceToken).to(DataMigrationService);
container.bind(DataMigratorToken).to(AnalyticsDataMigrator);
container.bind(DataMigratorToken).to(LegacyDataMigrator);
container.bind(DataMigratorToken).to(LoggingDataMigrator);
container.bind(DataMigratorToken).to(NotificationDataMigrator);
container.bind(DataMigratorToken).to(OAuthDataMigrator);
container.bind(DataMigratorToken).to(TemplateDataMigrator);
container.bind(DataMigratorToken).to(UrlShortenerDataMigrator);
container.bind(DataServiceToken).to(DataService);
container.bind(DataUpdaterToken).to(TemplateDataRepository);
container.bind(ExtensionInfoToken).to(ExtensionInfo);
container.bind(IntlServiceToken).to(IntlService);
container.bind(LegacyDataServiceToken).to(LegacyDataService);
container.bind(LoggingDataRepositoryToken).to(LoggingDataRepository);
container.bind(LoggingServiceToken).to(LoggingService);
container.bind(MessageConfigToken).toConstantValue(TabContentMessageConfig);
container.bind(MessageConfigToken).toConstantValue(TabContextMessageConfig);
container.bind(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind(MessageServiceToken).to(MessageService);
container.bind(MigrationDataRepositoryToken).to(MigrationDataRepository);
container.bind(NotificationDataRepositoryToken).to(NotificationDataRepository);
container.bind(OAuthDataRepositoryToken).to(OAuthDataRepository);
container.bind(TabServiceToken).to(TabService);
container.bind(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind(UiToken).to(MigrateUi);
container.bind(UrlShortenerDataRepositoryToken).to(UrlShortenerDataRepository);
container.bind(ValidationServiceToken).to(ValidationService);

// Must happen once all bindings are registered, as `LoggingService` cannot inject the repository itself.
configureLoggingService(container);

export { container };

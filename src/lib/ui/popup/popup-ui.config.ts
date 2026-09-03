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
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import { PopupUi } from 'extension/ui/popup/popup-ui';
import { Ui, UiToken } from 'extension/ui/ui';

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
container.bind<TabService>(TabServiceToken).to(TabService);
container.bind<TemplateDataRepository>(TemplateDataRepositoryToken).to(TemplateDataRepository);
container.bind<TemplateService>(TemplateServiceToken).to(TemplateService);
container.bind<Ui>(UiToken).to(PopupUi);

export { container };

import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import {
  AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { Container } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { GuideUi } from 'extension/ui/guide/guide-ui';
import { type Ui, UiToken } from 'extension/ui/ui';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind<AppearanceDataRepository>(AppearanceDataRepositoryToken).to(AppearanceDataRepository);
container.bind<AppearanceService>(AppearanceServiceToken).to(AppearanceService);
container.bind<DataService>(DataServiceToken).to(DataService);
container.bind<ExtensionInfo>(ExtensionInfoToken).to(ExtensionInfo);
container.bind<IntlService>(IntlServiceToken).to(IntlService);
container.bind<LoggingService>(LoggingServiceToken).to(LoggingService);
container.bind<Ui>(UiToken).to(GuideUi);
container.bind<ValidationService>(ValidationServiceToken).to(ValidationService);

export { container };

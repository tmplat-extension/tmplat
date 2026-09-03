import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import {
  AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { Container } from 'extension/common/di';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { GuideUi } from 'extension/ui/guide/guide-ui';
import { Ui, UiToken } from 'extension/ui/ui';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind<AppearanceDataRepository>(AppearanceDataRepositoryToken).to(AppearanceDataRepository);
container.bind<AppearanceService>(AppearanceServiceToken).to(AppearanceService);
container.bind<DataService>(DataServiceToken).to(DataService);
container.bind<IntlService>(IntlServiceToken).to(IntlService);
container.bind<Ui>(UiToken).to(GuideUi);

export { container };

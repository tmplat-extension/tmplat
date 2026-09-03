import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import {
  AppearanceDataRepository,
  AppearanceDataRepositoryToken,
} from 'extension/common/appearance/data/appearance-data.repository';
import { ChangelogService, ChangelogServiceToken } from 'extension/common/changelog/changelog.service';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { Container } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { ChangelogUi } from 'extension/ui/changelog/changelog-ui';
import { Ui, UiToken } from 'extension/ui/ui';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind<AppearanceDataRepository>(AppearanceDataRepositoryToken).to(AppearanceDataRepository);
container.bind<AppearanceService>(AppearanceServiceToken).to(AppearanceService);
container.bind<ChangelogService>(ChangelogServiceToken).to(ChangelogService);
container.bind<DataService>(DataServiceToken).to(DataService);
container.bind<ExtensionInfo>(ExtensionInfoToken).to(ExtensionInfo);
container.bind<IntlService>(IntlServiceToken).to(IntlService);
container.bind<Ui>(UiToken).to(ChangelogUi);

export { container };

import { Container } from 'extension/common/di';
import { OptionsUi } from 'extension/ui/options/options-ui';
import { Ui, UiToken } from 'extension/ui/ui';

const container = new Container({ skipBaseClassChecks: true });
container.bind<Ui>(UiToken).to(OptionsUi);

export { container };

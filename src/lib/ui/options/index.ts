import { container } from 'extension/ui/options/options-ui.config';
import { Ui, UiToken } from 'extension/ui/ui';

const ui = container.get<Ui>(UiToken);
(async () => {
  await ui.init();
})();

import { container } from 'extension/ui/popup/popup-ui.config';
import { Ui, UiToken } from 'extension/ui/ui';

const ui = container.get<Ui>(UiToken);
(async () => {
  await ui.init();
})();
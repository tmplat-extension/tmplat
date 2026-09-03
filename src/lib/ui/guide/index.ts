import 'extension/common/system/browser-api.polyfill';

import { container } from 'extension/ui/guide/guide-ui.config';
import { type Ui, UiToken } from 'extension/ui/ui';

const ui = container.get<Ui>(UiToken);
(async () => {
  await ui.init();
})();

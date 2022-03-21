import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { injectable } from 'extension/common/di';
import { App } from 'extension/ui/options/app/app';
import { Ui } from 'extension/ui/ui';

@injectable()
export class OptionsUi implements Ui {
  async init(): Promise<void> {
    // TODO: Complete
    const root = createRoot(document.getElementById('root') as HTMLElement);

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppearanceContext } from 'extension/common/appearance/appearance.context';
import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import { ChangelogContext } from 'extension/common/changelog/changelog.context';
import { ChangelogService, ChangelogServiceToken } from 'extension/common/changelog/changelog.service';
import { inject, injectable } from 'extension/common/di';
import { IntlContext } from 'extension/common/intl/intl.context';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { App } from 'extension/ui/changelog/app/app';
import { Ui } from 'extension/ui/ui';

@injectable()
export class ChangelogUi implements Ui {
  constructor(
    @inject(AppearanceServiceToken) private readonly appearanceService: AppearanceService,
    @inject(ChangelogServiceToken) private readonly changelogService: ChangelogService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
  ) {}

  async init(): Promise<void> {
    // Applied immediately (and kept in sync) alongside the MUI theme so that native browser UI (e.g. scrollbars)
    // also respects the user's chosen appearance
    this.appearanceService.applyToDocument();

    const root = createRoot(document.getElementById('root') as HTMLElement);

    root.render(
      <StrictMode>
        <IntlContext.Provider value={this.intl}>
          <AppearanceContext.Provider value={this.appearanceService}>
            <ChangelogContext.Provider value={this.changelogService}>
              <App />
            </ChangelogContext.Provider>
          </AppearanceContext.Provider>
        </IntlContext.Provider>
      </StrictMode>,
    );
  }
}

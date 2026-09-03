import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import { AppearanceContext } from 'extension/common/appearance/appearance.context';
import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import { inject, injectable } from 'extension/common/di';
import { IntlContext } from 'extension/common/intl/intl.context';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { SettingsContext } from 'extension/common/settings/settings.context';
import { SettingsService, SettingsServiceToken } from 'extension/common/settings/settings.service';
import { OAuthContext } from 'extension/oauth/oauth.context';
import { OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TabsContext } from 'extension/tab/tabs.context';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import { TemplatesContext } from 'extension/template/templates.context';
import { ErrorSnackbar } from 'extension/ui/common/components/error-snackbar/error-snackbar';
import { App } from 'extension/ui/options/app/app';
import { Ui } from 'extension/ui/ui';

function fallbackRender({ error }: { error: unknown }) {
  return <ErrorSnackbar error={error} />;
}

@injectable()
export class OptionsUi implements Ui {
  constructor(
    @inject(AnalyticsServiceToken) private readonly analyticsService: AnalyticsService,
    @inject(AppearanceServiceToken) private readonly appearanceService: AppearanceService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(OAuthServiceToken) private readonly oauthService: OAuthService,
    @inject(SettingsServiceToken) private readonly settingsService: SettingsService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
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
            <SettingsContext.Provider value={this.settingsService}>
              <OAuthContext.Provider value={this.oauthService}>
                <TemplatesContext.Provider value={this.templateService}>
                  <TabsContext.Provider value={this.tabService}>
                    {/* TODO: Log error onError */}
                    <ErrorBoundary fallbackRender={fallbackRender}>
                      <App />
                    </ErrorBoundary>
                  </TabsContext.Provider>
                </TemplatesContext.Provider>
              </OAuthContext.Provider>
            </SettingsContext.Provider>
          </AppearanceContext.Provider>
        </IntlContext.Provider>
      </StrictMode>,
    );

    // TODO: Re-evaluate analytics
    await this.analyticsService.trackEvent({
      category: 'Frames',
      action: 'Displayed',
      label: 'Options',
    });
  }
}

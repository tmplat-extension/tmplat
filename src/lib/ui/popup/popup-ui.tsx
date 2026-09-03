import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import { AppearanceContext } from 'extension/common/appearance/appearance.context';
import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import { inject, injectable } from 'extension/common/di';
import { IntlContext } from 'extension/common/intl/intl.context';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { MessagesContext } from 'extension/common/message/messages.context';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TabsContext } from 'extension/tab/tabs.context';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import { TemplatesContext } from 'extension/template/templates.context';
import { App } from 'extension/ui/popup/app/app';
import { Ui } from 'extension/ui/ui';

@injectable()
export class PopupUi implements Ui {
  constructor(
    @inject(AnalyticsServiceToken) private readonly analyticsService: AnalyticsService,
    @inject(AppearanceServiceToken) private readonly appearanceService: AppearanceService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(MessageServiceToken) private readonly messageService: MessageService,
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
            <MessagesContext.Provider value={this.messageService}>
              <TabsContext.Provider value={this.tabService}>
                <TemplatesContext.Provider value={this.templateService}>
                  <App />
                </TemplatesContext.Provider>
              </TabsContext.Provider>
            </MessagesContext.Provider>
          </AppearanceContext.Provider>
        </IntlContext.Provider>
      </StrictMode>,
    );

    // TODO: Re-evaluate analytics
    await this.analyticsService.trackEvent({
      category: 'Frames',
      action: 'Displayed',
      label: 'Popup',
    });
  }
}

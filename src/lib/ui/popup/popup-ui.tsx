import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { type AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import { AppearanceContext } from 'extension/common/appearance/appearance.context';
import { type AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import { inject, injectable } from 'extension/common/di';
import { IntlContext } from 'extension/common/intl/intl.context';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LoggingContext } from 'extension/common/logging/logging.context';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { MessagesContext } from 'extension/common/message/messages.context';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TabsContext } from 'extension/tab/tabs.context';
import { type TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import { TemplatesContext } from 'extension/template/templates.context';
import { ErrorSnackbar, type ErrorSnackbarProps } from 'extension/ui/common/components/error-snackbar/error-snackbar';
import { App } from 'extension/ui/popup/app/app';
import { type Ui } from 'extension/ui/ui';

const fallbackRender = ({ error }: ErrorSnackbarProps) => <ErrorSnackbar error={error} />;

@injectable()
export class PopupUi implements Ui {
  constructor(
    @inject(AnalyticsServiceToken) private readonly analyticsService: AnalyticsService,
    @inject(AppearanceServiceToken) private readonly appearanceService: AppearanceService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) private readonly logging: LoggingService,
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
        <LoggingContext.Provider value={this.logging}>
          <IntlContext.Provider value={this.intl}>
            <MessagesContext.Provider value={this.messageService}>
              <TabsContext.Provider value={this.tabService}>
                <AppearanceContext.Provider value={this.appearanceService}>
                  <TemplatesContext.Provider value={this.templateService}>
                    <ErrorBoundary
                      fallbackRender={fallbackRender}
                      onError={(error) => this.logging.getRootLogger().error('Uncaught error:', error)}
                    >
                      <App />
                    </ErrorBoundary>
                  </TemplatesContext.Provider>
                </AppearanceContext.Provider>
              </TabsContext.Provider>
            </MessagesContext.Provider>
          </IntlContext.Provider>
        </LoggingContext.Provider>
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

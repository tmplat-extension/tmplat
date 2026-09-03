import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { type AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import { AppearanceContext } from 'extension/common/appearance/appearance.context';
import { type AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import {
  type DataMigrationManager,
  DataMigrationManagerToken,
} from 'extension/common/data/migration/data-migration-manager';
import {
  type DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import { inject, injectable } from 'extension/common/di';
import { IntlContext } from 'extension/common/intl/intl.context';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LoggingContext } from 'extension/common/logging/logging.context';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { MessagesContext } from 'extension/common/message/messages.context';
import { ErrorSnackbar, type ErrorSnackbarProps } from 'extension/ui/common/components/error-snackbar/error-snackbar';
import { type Ui } from 'extension/ui/ui';

const fallbackRender = ({ error }: ErrorSnackbarProps) => <ErrorSnackbar error={error} />;

@injectable()
export class MigrateUi implements Ui {
  constructor(
    @inject(AnalyticsServiceToken) private readonly analyticsService: AnalyticsService,
    @inject(AppearanceServiceToken) private readonly appearanceService: AppearanceService,
    @inject(DataMigrationManagerToken) private readonly dataMigrationManager: DataMigrationManager,
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) private readonly logging: LoggingService,
    @inject(MessageServiceToken) private readonly messageService: MessageService,
  ) {}

  async init(): Promise<void> {
    // Applied immediately (and kept in sync) even though the rest of the page isn't rendered yet, so that native
    // browser UI (e.g. form controls, scrollbars) already respects the user's chosen appearance
    this.appearanceService.applyToDocument();

    const root = createRoot(document.getElementById('root') as HTMLElement);

    /*
     * TODO: Instead of starting migration on load:
     *  1. Check for "version" query string parameter
     *  2. If present, render version migration based on phase (allow user to export legacy data store before beginning migration)
     *  3. If not present, render list migrations in incomplete phase with drilldown available
     */
    // TODO: Run migrations on background worker using message passing and get progress updates the same way
    const { results: _results, version } = await this.dataMigrationManager.migrate();
    const _phase = this.dataMigrationService.getMigrationPhase(version);

    root.render(
      <StrictMode>
        <LoggingContext.Provider value={this.logging}>
          <IntlContext.Provider value={this.intl}>
            <MessagesContext.Provider value={this.messageService}>
              <AppearanceContext.Provider value={this.appearanceService}>
                <ErrorBoundary
                  fallbackRender={fallbackRender}
                  onError={(error) => this.logging.getRootLogger().error('Uncaught error:', error)}
                >
                  {/* TODO: Render App */}
                </ErrorBoundary>
              </AppearanceContext.Provider>
            </MessagesContext.Provider>
          </IntlContext.Provider>
        </LoggingContext.Provider>
      </StrictMode>,
    );

    await this.analyticsService.trackEvent({
      category: 'Frames',
      action: 'Displayed',
      label: 'Migrate',
    });
  }
}

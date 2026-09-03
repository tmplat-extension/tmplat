import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { AppearanceContext } from 'extension/common/appearance/appearance.context';
import { type AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
import {
  type DataMigrationManager,
  DataMigrationManagerToken,
} from 'extension/common/data/migration/data-migration-manager';
import { DataMigrationsContext } from 'extension/common/data/migration/data-migrations.context';
import { inject, injectable } from 'extension/common/di';
import { IntlContext } from 'extension/common/intl/intl.context';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LoggingContext } from 'extension/common/logging/logging.context';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { MessagesContext } from 'extension/common/message/messages.context';
import { ErrorSnackbar, type ErrorSnackbarProps } from 'extension/ui/common/components/error-snackbar/error-snackbar';
import { App } from 'extension/ui/migrate/app/app';
import { type Ui } from 'extension/ui/ui';

const fallbackRender = ({ error }: ErrorSnackbarProps) => <ErrorSnackbar error={error} />;

@injectable()
export class MigrateUi implements Ui {
  constructor(
    @inject(AppearanceServiceToken) private readonly appearanceService: AppearanceService,
    @inject(DataMigrationManagerToken) private readonly dataMigrationManager: DataMigrationManager,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) private readonly logging: LoggingService,
    @inject(MessageServiceToken) private readonly messageService: MessageService,
  ) {}

  async init(): Promise<void> {
    // Applied immediately (and kept in sync) alongside the MUI theme so that native browser UI (e.g. scrollbars)
    // also respects the user's chosen appearance
    this.appearanceService.applyToDocument();

    const root = createRoot(document.getElementById('root') as HTMLElement);

    /*
     * Nothing is migrated here. `App` renders first and only migrates once the user has seen what will happen and
     * asked for it, because several steps delete the legacy data they read and there is no way back afterwards.
     *
     * The migration deliberately runs in this page rather than on the background worker. An MV3 service worker is
     * terminated aggressively when idle, so a tab the user is actively watching is the more durable host; the only
     * thing the worker would buy is surviving an accidental tab close, which the retry on `MigrationResults`
     * already covers.
     */
    root.render(
      <StrictMode>
        <LoggingContext.Provider value={this.logging}>
          <IntlContext.Provider value={this.intl}>
            <MessagesContext.Provider value={this.messageService}>
              <AppearanceContext.Provider value={this.appearanceService}>
                <DataMigrationsContext.Provider value={this.dataMigrationManager}>
                  <ErrorBoundary
                    fallbackRender={fallbackRender}
                    onError={(error) => this.logging.getRootLogger().error('Uncaught error:', error)}
                  >
                    <App />
                  </ErrorBoundary>
                </DataMigrationsContext.Provider>
              </AppearanceContext.Provider>
            </MessagesContext.Provider>
          </IntlContext.Provider>
        </LoggingContext.Provider>
      </StrictMode>,
    );
  }
}

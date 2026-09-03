import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import {
  type DataMigrationManager,
  type DataMigrationManagerMigrateResult,
  type DataMigrationManagerRequiredMigrations,
} from 'extension/common/data/migration/data-migration-manager';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { installBrowserApiMock } from 'extension/test/browser-api.mock';
import { renderUi } from 'extension/test/ui';
import { App } from 'extension/ui/migrate/app/app';

const LEGACY_VERSION = '1.2.9' as ExtensionVersion;

const requiredMigrations: DataMigrationManagerRequiredMigrations = {
  migrations: [
    {
      namespaces: [
        {
          namespace: DataNamespace.Template,
          namespaceTitle: 'Templates',
          steps: ['Transferring templates'],
        },
      ],
      version: LEGACY_VERSION,
    },
  ],
  version: LEGACY_VERSION,
};

const passedResult: DataMigrationManagerMigrateResult = {
  results: [
    {
      namespace: DataNamespace.Template,
      outcome: DataMigrationOutcome.Completed,
      steps: [{ description: 'Transferring templates', outcome: DataMigrationStepOutcome.Passed }],
    },
  ],
  version: LEGACY_VERSION,
};

// Built lazily: `ExtensionError.from` localizes its message through the browser API, which is only faked once a
// test has installed the mock.
const createFailedResult = (): DataMigrationManagerMigrateResult => ({
  results: [
    {
      namespace: DataNamespace.Template,
      outcome: DataMigrationOutcome.Completed,
      steps: [
        {
          description: 'Transferring templates',
          errors: [ExtensionError.from('MIG500000')],
          outcome: DataMigrationStepOutcome.Failed,
        },
      ],
    },
  ],
  version: LEGACY_VERSION,
});

const createAppearanceServiceStub = () => ({
  addResolvedModeChangeListener: vi.fn(() => vi.fn()),
  getResolvedMode: vi.fn(async () => 'light' as const),
});

const renderApp = (dataMigrationManager: Partial<DataMigrationManager>) => {
  const appearanceService = createAppearanceServiceStub();

  renderUi(<App />, { contexts: { appearanceService, dataMigrationManager } });

  return { appearanceService, dataMigrationManager };
};

describe('MigrateApp', () => {
  beforeEach(() => {
    installBrowserApiMock();
  });

  it('shows what will be migrated before anything is touched', async () => {
    const migrate = vi.fn(async () => passedResult);
    renderApp({
      getRequiredMigrations: vi.fn(async () => requiredMigrations),
      migrate,
    });

    expect(await screen.findByText('Transferring templates')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'migrate_preview_start_button' })).toBeInTheDocument();
  });

  /*
   * Regression guard for the release blocker this page was rewritten to fix. `init()` used to `await migrate()`
   * before rendering anything, so the entire migration - including its destructive steps - had already happened by
   * the time the user saw the page, and they were never asked.
   */
  it('does not migrate until the user asks it to', async () => {
    const migrate = vi.fn(async () => passedResult);
    renderApp({
      getRequiredMigrations: vi.fn(async () => requiredMigrations),
      migrate,
    });
    await screen.findByRole('button', { name: 'migrate_preview_start_button' });

    expect(migrate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_start_button' }));

    expect(await screen.findByText('migrate_results_success_title')).toBeInTheDocument();
    expect(migrate).toHaveBeenCalledTimes(1);
  });

  /*
   * Regression guard for the second half of that blocker. `migrate()` rejects with MIG409000 once a migration is
   * complete, which is exactly the state of a *reloaded* migrate tab - and because the rejection happened before
   * `root.render()`, and an `ErrorBoundary` only catches errors thrown during render, the tab was permanently
   * blank. It is a normal state, not a failure.
   */
  it('reports an already-completed migration instead of rendering nothing', async () => {
    renderApp({
      getRequiredMigrations: vi.fn(async () => {
        throw ExtensionError.from('MIG409000', LEGACY_VERSION, '2.0.0' as ExtensionVersion);
      }),
    });

    expect(await screen.findByText('migrate_already_complete_title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'migrate_options_button' })).toBeInTheDocument();
  });

  it('explains that it was opened without a version to migrate from', async () => {
    renderApp({
      getRequiredMigrations: vi.fn(async () => {
        throw ExtensionError.from('MIG404000', 'version');
      }),
    });

    expect(await screen.findByText('migrate_unavailable_title')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'migrate_options_button' })).not.toBeInTheDocument();
  });

  it('surfaces any other failure while working out what needs migrating', async () => {
    renderApp({
      getRequiredMigrations: vi.fn(async () => {
        throw ExtensionError.from('MIG500000');
      }),
    });

    expect(await screen.findByText('migrate_error_title')).toBeInTheDocument();
  });

  it('falls back to a generic message when the failure is not an ExtensionError', async () => {
    renderApp({
      getRequiredMigrations: vi.fn(async () => {
        throw new Error('something entirely unexpected');
      }),
    });

    expect(await screen.findByText('migrate_error_title')).toBeInTheDocument();
    expect(screen.getByText('migrate_error_fallback')).toBeInTheDocument();
    expect(screen.queryByText('something entirely unexpected')).not.toBeInTheDocument();
  });

  it('shows progress while the migration is running', async () => {
    let release!: (result: DataMigrationManagerMigrateResult) => void;
    renderApp({
      getRequiredMigrations: vi.fn(async () => requiredMigrations),
      migrate: vi.fn(
        async () =>
          new Promise<DataMigrationManagerMigrateResult>((resolve) => {
            release = resolve;
          }),
      ),
    });
    await screen.findByRole('button', { name: 'migrate_preview_start_button' });

    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_start_button' }));

    expect(await screen.findByText('migrate_progress_message')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'migrate_preview_start_button' })).not.toBeInTheDocument();

    release(passedResult);

    expect(await screen.findByText('migrate_results_success_title')).toBeInTheDocument();
  });

  it('reports a migration failure rather than leaving the page on the spinner', async () => {
    renderApp({
      getRequiredMigrations: vi.fn(async () => requiredMigrations),
      migrate: vi.fn(async () => {
        throw ExtensionError.from('MIG500000');
      }),
    });
    await screen.findByRole('button', { name: 'migrate_preview_start_button' });

    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_start_button' }));

    expect(await screen.findByText('migrate_error_title')).toBeInTheDocument();
  });

  /*
   * The retry has to go through `retryMigration`, not `migrate`: `migrate` refuses to run a migration it has
   * already completed, so retrying with it would only ever reject with MIG409000.
   */
  it('retries through retryMigration, using the version the migration actually ran for', async () => {
    const retryMigration = vi.fn(async () => passedResult);
    const migrate = vi.fn(async () => createFailedResult());
    renderApp({
      getRequiredMigrations: vi.fn(async () => requiredMigrations),
      migrate,
      retryMigration,
    });
    await screen.findByRole('button', { name: 'migrate_preview_start_button' });
    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_start_button' }));
    await screen.findByText('migrate_results_failure_title');

    await userEvent.click(screen.getByRole('button', { name: 'migrate_results_retry_button' }));

    expect(retryMigration).toHaveBeenCalledExactlyOnceWith(LEGACY_VERSION);
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('migrate_results_success_title')).toBeInTheDocument();
  });

  /*
   * The interrupted-migration path. A run that never finished leaves the phase on `Started`, so every later attempt
   * reports `Unknown` and nothing runs. Only `retryMigration` resets the phase, so without this the user is stuck on
   * that screen permanently.
   */
  it('retries an unknown result through retryMigration, so an interrupted migration can be recovered', async () => {
    const retryMigration = vi.fn(async () => passedResult);
    const migrate = vi.fn(async (): Promise<DataMigrationManagerMigrateResult> => ({
      results: [{ namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Unknown }],
      version: LEGACY_VERSION,
    }));
    renderApp({ getRequiredMigrations: vi.fn(async () => requiredMigrations), migrate, retryMigration });
    await screen.findByRole('button', { name: 'migrate_preview_start_button' });
    await userEvent.click(screen.getByRole('button', { name: 'migrate_preview_start_button' }));
    await screen.findByText('migrate_results_unknown_title');

    await userEvent.click(screen.getByRole('button', { name: 'migrate_results_unknown_retry_button' }));

    expect(retryMigration).toHaveBeenCalledExactlyOnceWith(LEGACY_VERSION);
    expect(await screen.findByText('migrate_results_success_title')).toBeInTheDocument();
  });

  it('sets the page title', async () => {
    renderApp({ getRequiredMigrations: vi.fn(async () => requiredMigrations) });

    await waitFor(() => expect(document.title).toBe('app_page_title_migrate'));
  });
});

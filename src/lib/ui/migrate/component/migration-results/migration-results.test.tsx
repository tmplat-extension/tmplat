import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationManager } from 'extension/common/data/migration/data-migration-manager';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationResult } from 'extension/common/data/migration/data-migration.model';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Substitution } from 'extension/common/intl/intl.model';
import { type IntlService } from 'extension/common/intl/intl.service';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { renderUi } from 'extension/test/ui';
import { MigrationResults } from 'extension/ui/migrate/component/migration-results/migration-results';

const createError = (code: ExtensionErrorCode, message: string): ExtensionError =>
  ExtensionError.fromJSON(
    {
      code,
      message,
      name: `ExtensionError(${code})`,
    },
    {
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        isLevelEnabled: vi.fn(() => true),
        trace: vi.fn(),
        warn: vi.fn(),
      },
    },
  );

const passedResult: DataMigrationResult = {
  namespace: DataNamespace.Template,
  outcome: DataMigrationOutcome.Completed,
  steps: [{ description: 'Move templates', outcome: DataMigrationStepOutcome.Passed }],
};

const renderMigrationResults = (
  results: readonly DataMigrationResult[],
  options: {
    readonly dataMigrationManager?: Partial<DataMigrationManager>;
    readonly intl?: Partial<IntlService>;
    readonly onRetry?: () => void;
  } = {},
) => {
  const onRetry = options.onRetry ?? vi.fn();
  const dataMigrationManager = options.dataMigrationManager ?? {
    removeLegacyData: vi.fn<DataMigrationManager['removeLegacyData']>(async () => undefined),
  };

  renderUi(<MigrationResults onRetry={onRetry} results={results} />, {
    contexts: { dataMigrationManager, ...(options.intl ? { intl: options.intl } : {}) },
  });

  return { onRetry };
};

describe('MigrationResults', () => {
  it('renders a success result with an open-options button and no retry button when all steps passed', () => {
    renderMigrationResults([passedResult]);

    expect(screen.getByText('migrate_results_success_title')).toBeInTheDocument();
    expect(screen.getByText('migrate_results_success_message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'migrate_options_button' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'migrate_results_retry_button' })).not.toBeInTheDocument();
  });

  it('treats a completed namespace with a failed step as a failure', () => {
    renderMigrationResults([
      {
        namespace: DataNamespace.Template,
        outcome: DataMigrationOutcome.Completed,
        steps: [
          {
            description: 'Move templates',
            errors: [createError('MIG500100', 'Template data was invalid')],
            outcome: DataMigrationStepOutcome.Failed,
          },
        ],
      },
    ]);

    // Regression guard: a migration in which every step failed used to be indistinguishable from a clean one.
    expect(screen.getByText('migrate_results_failure_title')).toBeInTheDocument();
    expect(screen.getByText('migrate_results_failure_message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'migrate_results_retry_button' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'migrate_options_button' })).not.toBeInTheDocument();
  });

  it('renders a namespace failure notice and error without rendering steps', () => {
    renderMigrationResults([
      {
        error: createError('MIG500000', 'Template migration crashed'),
        namespace: DataNamespace.Template,
        outcome: DataMigrationOutcome.Failed,
      },
    ]);

    expect(screen.getByText('migrate_results_namespace_failed')).toBeInTheDocument();
    expect(screen.getByText('Template migration crashed')).toBeInTheDocument();
    expect(screen.queryByText('migrate_results_step_summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Move templates')).not.toBeInTheDocument();
  });

  it('offers a retry when every result is unknown, so an interrupted migration is not a dead end', async () => {
    const user = userEvent.setup();
    const { onRetry } = renderMigrationResults([
      { namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Unknown },
      { namespace: DataNamespace.UrlShortener, outcome: DataMigrationOutcome.Unknown },
    ]);

    expect(screen.getByText('migrate_results_unknown_title')).toBeInTheDocument();
    expect(screen.getByText('migrate_results_unknown_message')).toBeInTheDocument();

    // The unknown state used to render no action whatsoever, stranding anyone whose previous attempt was
    // interrupted: the phase stays `Started`, so every later attempt reports `Unknown` as well.
    await user.click(screen.getByRole('button', { name: 'migrate_results_unknown_retry_button' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not offer the result actions when every result is unknown', () => {
    renderMigrationResults([{ namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Unknown }]);

    expect(screen.queryByRole('button', { name: 'migrate_results_retry_button' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'migrate_options_button' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'migrate_legacy_data_discard_button' })).not.toBeInTheDocument();
  });

  it('renders the passed, skipped and failed step counts for each namespace', () => {
    renderMigrationResults(
      [
        {
          namespace: DataNamespace.Template,
          outcome: DataMigrationOutcome.Completed,
          steps: [
            { description: 'Move templates', outcome: DataMigrationStepOutcome.Passed },
            { description: 'Skip template shortcuts', outcome: DataMigrationStepOutcome.Skipped, reasons: ['No data'] },
            {
              description: 'Move template options',
              errors: [createError('MIG500100', 'Template options were invalid')],
              outcome: DataMigrationStepOutcome.Failed,
            },
          ],
        },
      ],
      {
        intl: {
          getLocale: vi.fn<IntlService['getLocale']>(async () => 'en-US'),
          getLocales: vi.fn<IntlService['getLocales']>(async () => ['en-US'] as [string, ...string[]]),
          getMessage: vi.fn((key: IntlMessageKey, ...substitutions: Substitution[]) =>
            [key, ...substitutions.map(String)].join('|'),
          ),
        },
      },
    );

    expect(screen.getByText('migrate_results_step_summary|1|1|1')).toBeInTheDocument();
  });

  it('calls onRetry exactly once when the retry button is clicked', async () => {
    const { onRetry } = renderMigrationResults([
      {
        namespace: DataNamespace.Template,
        outcome: DataMigrationOutcome.Completed,
        steps: [
          {
            description: 'Move templates',
            errors: [createError('MIG500100', 'Template data was invalid')],
            outcome: DataMigrationStepOutcome.Failed,
          },
        ],
      },
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'migrate_results_retry_button' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('only shows discard-and-retry when a failure has legacy data, then removes every legacy key before retrying', async () => {
    const removeLegacyData = vi.fn<DataMigrationManager['removeLegacyData']>(async () => undefined);
    const { onRetry } = renderMigrationResults(
      [
        {
          namespace: DataNamespace.Template,
          outcome: DataMigrationOutcome.Completed,
          steps: [
            {
              description: 'Move templates',
              errors: [createError('MIG500100', 'Template data was invalid')],
              legacy: [
                { data: { title: 'Legacy template' }, key: 'templates', storage: 'local' },
                { data: ['queued-action'], key: 'pending', storage: 'session' },
              ],
              outcome: DataMigrationStepOutcome.Failed,
            },
          ],
        },
      ],
      { dataMigrationManager: { removeLegacyData } },
    );

    await userEvent.click(screen.getByRole('button', { name: 'migrate_legacy_data_discard_button' }));

    await waitFor(() => expect(removeLegacyData).toHaveBeenCalledTimes(1));
    expect(removeLegacyData).toHaveBeenCalledWith([
      { key: 'templates', storage: 'local' },
      { key: 'pending', storage: 'session' },
    ]);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show discard-and-retry when a failed step has no legacy data', () => {
    renderMigrationResults([
      {
        namespace: DataNamespace.Template,
        outcome: DataMigrationOutcome.Completed,
        steps: [
          {
            description: 'Move templates',
            errors: [createError('MIG500100', 'Template data was invalid')],
            outcome: DataMigrationStepOutcome.Failed,
          },
        ],
      },
    ]);

    expect(screen.queryByRole('button', { name: 'migrate_legacy_data_discard_button' })).not.toBeInTheDocument();
  });

  it('shows an error and does not retry when discard-and-retry cannot remove legacy data', async () => {
    const removeLegacyData = vi.fn<DataMigrationManager['removeLegacyData']>(async () =>
      Promise.reject(new Error('Cannot remove legacy data')),
    );
    const { onRetry } = renderMigrationResults(
      [
        {
          namespace: DataNamespace.Template,
          outcome: DataMigrationOutcome.Completed,
          steps: [
            {
              description: 'Move templates',
              errors: [createError('MIG500100', 'Template data was invalid')],
              legacy: [{ data: { title: 'Legacy template' }, key: 'templates', storage: 'local' }],
              outcome: DataMigrationStepOutcome.Failed,
            },
          ],
        },
      ],
      {
        dataMigrationManager: { removeLegacyData },
      },
    );

    await userEvent.click(screen.getByRole('button', { name: 'migrate_legacy_data_discard_button' }));

    expect(await screen.findByText('migrate_error_fallback')).toBeInTheDocument();
    expect(removeLegacyData).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('opens the options page from a successful migration', async () => {
    renderMigrationResults([passedResult]);

    await userEvent.click(screen.getByRole('button', { name: 'migrate_options_button' }));

    expect(getBrowserApiMock().runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it('shows an error alert when the options page cannot be opened', async () => {
    getBrowserApiMock().runtime.openOptionsPage.mockRejectedValueOnce(new Error('Cannot open options'));
    renderMigrationResults([passedResult]);

    await userEvent.click(screen.getByRole('button', { name: 'migrate_options_button' }));

    expect(await screen.findByText('migrate_error_fallback')).toBeInTheDocument();
  });
});

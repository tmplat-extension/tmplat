import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationStepResult } from 'extension/common/data/migration/data-migration.model';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { renderUi } from 'extension/test/ui';
import { MigrationStepList } from 'extension/ui/migrate/component/migration-step-list/migration-step-list';

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

const renderMigrationStepList = (steps: readonly DataMigrationStepResult[]) => {
  renderUi(<MigrationStepList steps={steps} />);
};

describe('MigrationStepList', () => {
  it('renders each step description and outcome label, including duplicate descriptions', () => {
    renderMigrationStepList([
      { description: 'Move templates', outcome: DataMigrationStepOutcome.Passed },
      { description: 'Move templates', outcome: DataMigrationStepOutcome.Skipped, reasons: ['Already moved'] },
      {
        description: 'Move logging settings',
        errors: [createError('MIG500000', 'Logging settings could not be migrated')],
        outcome: DataMigrationStepOutcome.Failed,
      },
    ]);

    expect(screen.getAllByText('Move templates')).toHaveLength(2);
    expect(screen.getByText('Move logging settings')).toBeInTheDocument();
    expect(screen.getByText('migrate_step_outcome_passed')).toBeInTheDocument();
    expect(screen.getByText('migrate_step_outcome_skipped')).toBeInTheDocument();
    expect(screen.getByText('migrate_step_outcome_failed')).toBeInTheDocument();
  });

  it('renders every skipped reason', () => {
    renderMigrationStepList([
      {
        description: 'Skip optional settings',
        outcome: DataMigrationStepOutcome.Skipped,
        reasons: ['No legacy setting was present', 'The default value is already correct'],
      },
    ]);

    expect(screen.getByText('No legacy setting was present')).toBeInTheDocument();
    expect(screen.getByText('The default value is already correct')).toBeInTheDocument();
  });

  it('renders every failed ExtensionError message', () => {
    renderMigrationStepList([
      {
        description: 'Move templates',
        errors: [
          createError('MIG500100', 'Template data was invalid'),
          createError('MIG500200', 'Template storage could not be written'),
        ],
        outcome: DataMigrationStepOutcome.Failed,
      },
    ]);

    expect(screen.getByText('Template data was invalid')).toBeInTheDocument();
    expect(screen.getByText('Template storage could not be written')).toBeInTheDocument();
  });

  it('renders legacy data carried by a failed step', () => {
    renderMigrationStepList([
      {
        description: 'Move templates',
        errors: [createError('MIG500100', 'Template data was invalid')],
        legacy: [
          { data: { title: 'Legacy template' }, key: 'templates', storage: 'local' },
          { data: ['queued-action'], key: 'pending', storage: 'session' },
        ],
        outcome: DataMigrationStepOutcome.Failed,
      },
    ]);

    expect(screen.getByText('migrate_legacy_data_heading')).toBeInTheDocument();
    expect(screen.getByText('migrate_legacy_data_description')).toBeInTheDocument();
    expect(screen.getByText('local:templates = {"title":"Legacy template"}')).toBeInTheDocument();
    expect(screen.getByText('session:pending = ["queued-action"]')).toBeInTheDocument();
  });

  it('does not render the legacy-data heading for a failed step with no legacy entries', () => {
    renderMigrationStepList([
      {
        description: 'Move templates',
        errors: [createError('MIG500100', 'Template data was invalid')],
        outcome: DataMigrationStepOutcome.Failed,
      },
    ]);

    expect(screen.queryByText('migrate_legacy_data_heading')).not.toBeInTheDocument();
  });
});

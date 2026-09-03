import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { MigrationNotice } from 'extension/ui/migrate/component/migration-notice/migration-notice';

describe('MigrationNotice', () => {
  it('renders the title and message', () => {
    renderUi(
      <MigrationNotice severity="info" title="Migration ready" message="Review the migration before starting." />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Migration ready');
    expect(alert).toHaveTextContent('Review the migration before starting.');
  });

  it('renders supplied actions', () => {
    renderUi(
      <MigrationNotice
        severity="warning"
        title="Migration blocked"
        message="Some legacy data needs attention."
        actions={<button type="button">Retry migration</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Retry migration' })).toBeInTheDocument();
  });

  it('omits actions when none are supplied', () => {
    renderUi(<MigrationNotice severity="success" title="Migration complete" message="Everything has been migrated." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['error', 'ErrorOutlineIcon'],
    ['info', 'InfoOutlinedIcon'],
    ['success', 'SuccessOutlinedIcon'],
    ['warning', 'ReportProblemOutlinedIcon'],
  ] as const)('passes %s severity to the rendered alert', (severity, iconTestId) => {
    renderUi(<MigrationNotice severity={severity} title="Migration status" message="Current migration status." />);

    expect(screen.getByRole('alert').querySelector(`[data-testid="${iconTestId}"]`)).toBeInTheDocument();
  });
});

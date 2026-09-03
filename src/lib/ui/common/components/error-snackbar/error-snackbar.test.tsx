import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExtensionError } from 'extension/common/error/extension-error';
import { renderUi } from 'extension/test/ui';
import { ErrorSnackbar } from 'extension/ui/common/components/error-snackbar/error-snackbar';

describe('ErrorSnackbar', () => {
  it('renders the message and code from the error detail', () => {
    renderUi(<ErrorSnackbar error={ExtensionError.from('ERR500000')} />);

    expect(screen.getByRole('alert')).toHaveTextContent('ERR500000');
  });

  it('falls back to the contextual message and code for an unrecognised error', () => {
    renderUi(<ErrorSnackbar error={undefined} />);

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('error_snackbar_unknown_message');
    expect(alert).toHaveTextContent('ERR500000');
  });

  it('does not render the stack trace section when the error has no stack', () => {
    renderUi(<ErrorSnackbar error={undefined} />);

    expect(screen.queryByRole('button', { name: 'error_snackbar_stack_button' })).not.toBeInTheDocument();
  });

  it('collapses the stack trace by default and expands it on demand', async () => {
    const user = userEvent.setup();
    const error = new Error('Boom');
    error.stack = 'Error: Boom\n    at somewhere.ts:1:1';

    renderUi(<ErrorSnackbar error={error} />);

    const toggle = screen.getByRole('button', { name: 'error_snackbar_stack_button' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/at somewhere\.ts/)).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/at somewhere\.ts/)).toBeInTheDocument();
  });
});

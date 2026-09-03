import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsSwitch } from 'extension/ui/options/component/settings-switch/settings-switch';

describe('SettingsSwitch', () => {
  it('renders the label and reflects the checked state', () => {
    render(<SettingsSwitch checked label="Enable analytics" onChange={vi.fn()} />);

    expect(screen.getByRole('switch', { name: 'Enable analytics' })).toBeChecked();
  });

  it('reports the new checked state when toggled', async () => {
    const onChange = vi.fn();
    render(<SettingsSwitch checked={false} label="Enable analytics" onChange={onChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Enable analytics' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toBe(true);
  });

  it('does not report changes while disabled', async () => {
    const onChange = vi.fn();
    render(<SettingsSwitch checked={false} disabled label="Enable analytics" onChange={onChange} />);
    // `disabled` is set on the wrapping `FormControl`, not the `Switch`, so this also covers the context propagation
    // that makes that layout choice safe. The pointer-events check is disabled so that the click is actually
    // attempted -- otherwise user-event refuses up front and the assertion below proves nothing.
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(screen.getByRole('switch', { name: 'Enable analytics' }));

    expect(screen.getByRole('switch', { name: 'Enable analytics' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders helper text only when provided', () => {
    const { rerender } = render(<SettingsSwitch checked label="Enable analytics" onChange={vi.fn()} />);

    expect(screen.queryByText('Sends anonymous usage data')).not.toBeInTheDocument();

    rerender(
      <SettingsSwitch checked helperText="Sends anonymous usage data" label="Enable analytics" onChange={vi.fn()} />,
    );

    expect(screen.getByText('Sends anonymous usage data')).toBeInTheDocument();
  });
});

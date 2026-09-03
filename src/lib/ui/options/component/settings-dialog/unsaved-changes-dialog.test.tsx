import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { UnsavedChangesDialog } from 'extension/ui/options/component/settings-dialog/unsaved-changes-dialog';

describe('UnsavedChangesDialog', () => {
  it('renders the localized prompt only while open', () => {
    const { rerender } = renderUi(
      <UnsavedChangesDialog open={false} onCancel={vi.fn()} onDiscard={vi.fn()} onSave={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog', { name: 'settings_dialog_unsaved_changes_title' })).not.toBeInTheDocument();

    rerender(<UnsavedChangesDialog open onCancel={vi.fn()} onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'settings_dialog_unsaved_changes_title' })).toBeInTheDocument();
    expect(screen.getByText('settings_dialog_unsaved_changes_content')).toBeInTheDocument();
  });

  it('reports cancel, discard and save actions', async () => {
    const onCancel = vi.fn();
    const onDiscard = vi.fn();
    const onSave = vi.fn();
    renderUi(<UnsavedChangesDialog open onCancel={onCancel} onDiscard={onDiscard} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: 'settings_dialog_unsaved_changes_cancel_button' }));
    await userEvent.click(screen.getByRole('button', { name: 'settings_dialog_unsaved_changes_discard_button' }));
    await userEvent.click(screen.getByRole('button', { name: 'settings_dialog_unsaved_changes_save_button' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables every action while saving', () => {
    renderUi(<UnsavedChangesDialog open saving onCancel={vi.fn()} onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'settings_dialog_unsaved_changes_cancel_button' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'settings_dialog_unsaved_changes_discard_button' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'settings_dialog_unsaved_changes_save_button' })).toBeDisabled();
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type Settings } from 'extension/common/settings/settings.model';
import { renderUi } from 'extension/test/ui';
import { SettingsDialog } from 'extension/ui/options/component/settings-dialog/settings-dialog';
import { createSettings } from 'extension/ui/options/test-fixtures';

const createTemplateServiceStub = () => ({
  getTemplateDescription: vi.fn(() => 'Template description'),
  getTemplateTitle: vi.fn(() => 'Template title'),
  getTemplates: vi.fn(async () => []),
});

const renderSettingsDialog = (settings: Settings = createSettings()) => {
  const onClose = vi.fn();
  const settingsService = {
    getSettings: vi.fn(async () => settings),
    saveSettings: vi.fn(async () => undefined),
  };
  const templateService = createTemplateServiceStub();

  renderUi(<SettingsDialog open onClose={onClose} />, {
    contexts: { settingsService, templateService },
  });

  return { onClose, settingsService, templateService };
};

const lastButton = (name: string) => screen.getAllByRole('button', { name }).at(-1)!;

describe('SettingsDialog', () => {
  it('renders loaded settings on the general page', async () => {
    renderSettingsDialog();

    expect(await screen.findByText('settings_general_toolbar_button_title')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'settings_general_toolbar_button_auto_close_label' })).toBeChecked();
  });

  it('calls onClose immediately when there are no unsaved changes', async () => {
    const { onClose } = renderSettingsDialog();
    await screen.findByText('settings_general_toolbar_button_title');

    await userEvent.click(lastButton('settings_dialog_close_button_label'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a contextual error when settings fail to load', async () => {
    const settingsService = {
      getSettings: vi.fn(async () => Promise.reject(new Error('No settings'))),
      saveSettings: vi.fn(async () => undefined),
    };

    renderUi(<SettingsDialog open onClose={vi.fn()} />, { contexts: { settingsService } });

    expect(await screen.findByText('error_snackbar_unknown_message')).toBeInTheDocument();
  });

  it('keeps save controls disabled before any change', async () => {
    renderSettingsDialog();
    await screen.findByText('settings_general_toolbar_button_title');

    expect(screen.getByRole('button', { name: 'settings_dialog_reset_button' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'settings_dialog_apply_button' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'settings_dialog_save_button' })).toBeDisabled();
  });

  // Regression: `useErrorMessage` used to return a new closure per render, and this dialog's loading effect lists
  // it as a dependency. The effect therefore re-ran on every render, called `getSettings()` and set state, which
  // re-rendered and re-ran the effect. Because the real `SettingsService.getSettings()` ends in `structuredClone`,
  // every call returned a fresh object, so React's `setState` bail-out never damped the loop -- a probe mirroring
  // production recorded 685 reads in 1.5s. The three tests below cover the loop and its two user-facing symptoms.
  it('loads settings exactly once per open', async () => {
    const { settingsService } = renderSettingsDialog();

    await screen.findByText('settings_general_toolbar_button_title');

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
  });

  it('loads settings exactly once even when each call returns a fresh object, as production does', async () => {
    const settingsService = {
      getSettings: vi.fn(async () => structuredClone(createSettings())),
      saveSettings: vi.fn(async () => undefined),
    };
    renderUi(<SettingsDialog open onClose={vi.fn()} />, {
      contexts: { settingsService, templateService: createTemplateServiceStub() },
    });

    await screen.findByText('settings_general_toolbar_button_title');

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
  });

  it('keeps the selected page visible after navigating away from General', async () => {
    renderSettingsDialog();
    await screen.findByText('settings_general_toolbar_button_title');

    await userEvent.click(lastButton('settings_dialog_page_analytics'));

    expect(await screen.findByText('settings_analytics_title')).toBeInTheDocument();
    expect(screen.queryByText('settings_general_toolbar_button_title')).not.toBeInTheDocument();
  });

  it('retains an edited field so that it can be saved', async () => {
    const { settingsService } = renderSettingsDialog();
    await screen.findByText('settings_general_toolbar_button_title');

    await userEvent.click(screen.getByRole('switch', { name: 'settings_general_toolbar_button_auto_close_label' }));

    expect(screen.getByRole('switch', { name: 'settings_general_toolbar_button_auto_close_label' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'settings_dialog_apply_button' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'settings_dialog_apply_button' }));

    expect(settingsService.saveSettings).toHaveBeenCalledTimes(1);
  });
});

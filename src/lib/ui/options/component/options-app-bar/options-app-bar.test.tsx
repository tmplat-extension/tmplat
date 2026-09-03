import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type SettingsService } from 'extension/common/settings/settings.service';
import { type TabService } from 'extension/tab/tab.service';
import { renderUi } from 'extension/test/ui';
import OptionsAppBar from 'extension/ui/options/component/options-app-bar/options-app-bar';
import { createSettings } from 'extension/ui/options/test-fixtures';

const setup = ({ query = '' } = {}) => {
  const onQueryChange = vi.fn();
  const settingsService = {
    getSettings: vi.fn(async () => createSettings()),
    saveSettings: vi.fn(async () => undefined),
  } as Partial<SettingsService>;
  const tabService = {
    createExtensionTab: vi.fn(async () => undefined),
  } as Partial<TabService>;
  const templateService = {
    getTemplateDescription: vi.fn(() => 'Template description'),
    getTemplateTitle: vi.fn(() => 'Template title'),
    getTemplates: vi.fn(async () => []),
  };

  renderUi(<OptionsAppBar query={query} onQueryChange={onQueryChange} />, {
    contexts: { settingsService, tabService, templateService },
  });

  return { onQueryChange, settingsService, tabService, user: userEvent.setup() };
};

const lastButton = (name: string): HTMLElement => screen.getAllByRole('button', { name }).at(-1)!;

describe('OptionsAppBar', () => {
  it('renders the logo, search box and external links', () => {
    setup({ query: 'abc' });

    expect(screen.getByRole('img', { name: 'name' })).toHaveAttribute('src', 'img/logo_mark_inverse.svg');
    expect(screen.getByRole('textbox', { name: 'options_app_bar_search_label' })).toHaveValue('abc');
    expect(screen.getByRole('link', { name: 'options_app_bar_sponsor_label' })).toHaveAttribute(
      'href',
      'https://github.com/sponsors/airmrcr',
    );
    expect(screen.getByRole('link', { name: 'options_app_bar_issue_label' })).toHaveAttribute(
      'href',
      'https://github.com/tmplat-extension/tmplat/issues',
    );
  });

  it('reports search query changes', async () => {
    const { onQueryChange, user } = setup({ query: 'titl' });

    await user.type(screen.getByRole('textbox', { name: 'options_app_bar_search_label' }), 'e');

    expect(onQueryChange).toHaveBeenCalledWith('title');
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it('opens and closes the guide dialog', async () => {
    const { tabService, user } = setup();

    await user.click(lastButton('options_app_bar_guide_label'));

    expect(await screen.findByText('guide_title')).toBeInTheDocument();

    await user.click(lastButton('guide_open_in_new_tab_label'));
    expect(tabService.createExtensionTab).toHaveBeenCalledWith('guide.html');

    await user.click(lastButton('guide_close_button_label'));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { level: 1, name: 'guide_title' })).not.toBeInTheDocument(),
    );
  });

  it('opens the settings dialog and loads settings exactly once', async () => {
    const { settingsService, user } = setup();

    await user.click(lastButton('options_app_bar_settings_label'));

    expect(await screen.findByText('settings_dialog_title')).toBeInTheDocument();
    expect(await screen.findByText('settings_general_toolbar_button_title')).toBeInTheDocument();
    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
  });
});

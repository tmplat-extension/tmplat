import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type SettingsGeneral } from 'extension/common/settings/settings.model';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type Template } from 'extension/template/template.model';
import { renderUi } from 'extension/test/ui';
import { GeneralSettings } from 'extension/ui/options/component/general-settings/general-settings';
import { createSettings, createUserTemplate } from 'extension/ui/options/test-fixtures';

const renderGeneralSettings = (templates: Template[] = [], settings: SettingsGeneral = createSettings().general) => {
  const onChange = vi.fn();
  // Returning a fresh array per call mirrors production, where `getTemplates()` resolves a newly built array. A stub
  // returning one stable reference would let React's `setState` bail-out hide a re-render loop.
  const templateService = {
    getTemplates: vi.fn(async () => [...templates]),
    getTemplateTitle: vi.fn((template: Template) => (template.predefined ? template.titleKey : template.title)),
  };

  renderUi(<GeneralSettings onChange={onChange} settings={settings} />, {
    contexts: { templateService },
  });

  return { onChange, templateService };
};

describe('GeneralSettings', () => {
  it('renders the toolbar button section once templates have loaded', async () => {
    renderGeneralSettings();

    expect(await screen.findByText('settings_general_toolbar_button_title')).toBeInTheDocument();
  });

  // Regression: this effect depends on `getErrorDetail` and sets state. While `useErrorDetail` returned a new
  // closure per render, the effect re-ran on every render and re-triggered itself indefinitely. Same root cause as
  // the `SettingsDialog` loop.
  it('loads templates exactly once', async () => {
    const { templateService } = renderGeneralSettings();

    await screen.findByText('settings_general_toolbar_button_title');
    await waitFor(() => expect(templateService.getTemplates).toHaveBeenCalled());

    expect(templateService.getTemplates).toHaveBeenCalledTimes(1);
  });

  /*
   * `TemplateService` can only answer a "Template" mode that names no template by falling back to the popup/menu the
   * user just turned off. Seeding the id here is what makes that state unreachable rather than merely tolerated.
   */
  it('seeds the template selection when the toolbar button switches to template mode', async () => {
    const { onChange } = renderGeneralSettings([
      createUserTemplate({ enabled: false, id: 'disabled' }),
      createUserTemplate({ id: 'enabled' }),
    ]);

    await screen.findByText('settings_general_toolbar_button_title');
    await userEvent.click(await screen.findByRole('radio', { name: 'settings_general_toolbar_button_template_label' }));

    expect(onChange.mock.lastCall?.[0].action).toMatchObject({ mode: 'template', templateId: 'enabled' });
  });

  it('seeds the template selection when the context menu switches to template mode', async () => {
    const { onChange } = renderGeneralSettings([createUserTemplate({ id: 'enabled' })]);

    await screen.findByText('settings_general_toolbar_button_title');
    await userEvent.click(
      await screen.findByRole('radio', { name: 'settings_general_context_menu_mode_template_label' }),
    );

    expect(onChange.mock.lastCall?.[0].contextMenu).toMatchObject({ mode: 'template', templateId: 'enabled' });
  });

  it('leaves the template selection alone when it still names a template, even a disabled one', async () => {
    const settings = createSettings().general;
    const { onChange } = renderGeneralSettings(
      [createUserTemplate({ id: 'enabled' }), createUserTemplate({ enabled: false, id: 'chosen' })],
      { ...settings, action: { ...settings.action, templateId: 'chosen' } },
    );

    await screen.findByText('settings_general_toolbar_button_title');
    await userEvent.click(await screen.findByRole('radio', { name: 'settings_general_toolbar_button_template_label' }));

    expect(onChange.mock.lastCall?.[0].action.templateId).toBe('chosen');
  });

  it('only offers a context menu template field in template mode', async () => {
    const settings = createSettings().general;
    renderGeneralSettings([createUserTemplate({ id: 'enabled' })], settings);

    await screen.findByText('settings_general_context_menu_title');

    expect(screen.queryByLabelText('settings_general_context_menu_template_field_label')).toBeNull();
  });

  /*
   * The two ids used to be one, so choosing a template for the context menu silently changed the toolbar button too.
   */
  it('changes only the context menu template when its field is used', async () => {
    const settings = createSettings().general;
    const { onChange } = renderGeneralSettings(
      [createUserTemplate({ id: 'enabled', title: 'Enabled' }), createUserTemplate({ id: 'other', title: 'Other' })],
      {
        ...settings,
        contextMenu: { ...settings.contextMenu, mode: TemplateContextMenuMode.Template, templateId: 'enabled' },
      },
    );

    await userEvent.click(await screen.findByLabelText('settings_general_context_menu_template_field_label'));
    await userEvent.click(await screen.findByRole('option', { name: 'Other' }));

    expect(onChange.mock.lastCall?.[0]).toMatchObject({
      action: { templateId: settings.action.templateId },
      contextMenu: { templateId: 'other' },
    });
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type IntlService } from 'extension/common/intl/intl.service';
import { TEMPLATE_TITLE_MAX_LENGTH } from 'extension/template/template-transfer.schema';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';
import { renderUi } from 'extension/test/ui';
import {
  getTemplateEditorErrors,
  TemplateEditorDialog,
} from 'extension/ui/options/component/template-editor-dialog/template-editor-dialog';
import { createPredefinedTemplate, createUserTemplate } from 'extension/ui/options/test-fixtures';

const templateService = () => ({
  createTemplate: vi.fn(async () => createUserTemplate()),
  getTemplateDescription: vi.fn((template: Template) =>
    template.predefined ? template.descriptionKey : template.description,
  ) as unknown as TemplateService['getTemplateDescription'],
  getTemplateTitle: vi.fn((template: Template) => (template.predefined ? template.titleKey : template.title)),
  removeTemplates: vi.fn(async () => undefined),
  updateTemplate: vi.fn(async () => createUserTemplate()),
});

const renderEditor = (props: Partial<Parameters<typeof TemplateEditorDialog>[0]> = {}, intl?: Partial<IntlService>) => {
  const service = templateService();
  const onClose = vi.fn();
  const onSaved = vi.fn(async () => undefined);

  renderUi(<TemplateEditorDialog open onClose={onClose} onSaved={onSaved} templates={[]} {...props} />, {
    contexts: { intl, tabService: { createExtensionTab: vi.fn(async () => undefined) }, templateService: service },
  });

  return { onClose, onSaved, service };
};

describe('getTemplateEditorErrors', () => {
  const intl = { getMessage: vi.fn((key: string, ...substitutions: string[]) => [key, ...substitutions].join('|')) };

  it('validates required editable fields and shortcut conflicts', () => {
    const errors = getTemplateEditorErrors(
      { content: ' ', description: '', enabled: true, shortcut: 'x', title: ' ' },
      {
        intl: intl as unknown as IntlService,
        predefined: false,
        templates: [createUserTemplate({ id: 'other', shortcut: 'X' })],
      },
    );

    expect(errors).toEqual({
      content: 'template_editor_error_content_required',
      shortcut: 'template_editor_error_shortcut_conflict',
      title: 'template_editor_error_title_required',
    });
  });

  it('does not validate immutable predefined title and content', () => {
    const errors = getTemplateEditorErrors(
      { content: '', description: '', enabled: true, shortcut: '', title: '' },
      { intl: intl as unknown as IntlService, predefined: true, templates: [] },
    );

    expect(errors).toEqual({});
  });

  it('reports overlong title and shortcut values', () => {
    const errors = getTemplateEditorErrors(
      {
        content: 'content',
        description: '',
        enabled: true,
        shortcut: 'AB',
        title: 'x'.repeat(TEMPLATE_TITLE_MAX_LENGTH + 1),
      },
      { intl: intl as unknown as IntlService, predefined: false, templates: [] },
    );

    expect(errors).toEqual({
      shortcut: 'template_editor_error_shortcut_too_long',
      title: `template_editor_error_title_too_long|${TEMPLATE_TITLE_MAX_LENGTH}`,
    });
  });
});

describe('TemplateEditorDialog', () => {
  it('creates a trimmed user template with an upper-case shortcut', async () => {
    const { onClose, onSaved, service } = renderEditor();

    await userEvent.type(screen.getByRole('textbox', { name: 'template_editor_title_field_label' }), '  New title  ');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'template_editor_description_field_label' }),
      '  Description  ',
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'template_editor_content_field_label' }), 'Template body');
    await userEvent.type(screen.getByRole('textbox', { name: 'template_editor_shortcut_field_label' }), 'n');
    await userEvent.click(screen.getByRole('button', { name: 'template_editor_save_button' }));

    await waitFor(() => expect(service.createTemplate).toHaveBeenCalledTimes(1));
    expect(service.createTemplate).toHaveBeenCalledWith({
      content: 'Template body',
      description: 'Description',
      enabled: true,
      shortcut: 'N',
      title: 'New title',
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pre-populates a clone as a new editable template and resets enabled state and shortcut', async () => {
    const cloneFrom = createUserTemplate({ enabled: false, shortcut: 'C', title: 'Original' });
    const { service } = renderEditor(
      { cloneFrom },
      { getMessage: (key) => (key === 'template_editor_clone_title_suffix' ? ' copy' : key) },
    );

    expect(screen.getByRole('textbox', { name: 'template_editor_title_field_label' })).toHaveValue('Original copy');
    expect(screen.getByRole('textbox', { name: 'template_editor_shortcut_field_label' })).toHaveValue('');
    expect(screen.getByRole('switch', { name: 'template_editor_enabled_label' })).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'template_editor_save_button' }));

    await waitFor(() => expect(service.createTemplate).toHaveBeenCalledTimes(1));
  });

  it('updates only enabled and shortcut when editing a predefined template', async () => {
    const template = createPredefinedTemplate({ enabled: true, shortcut: null });
    const { service } = renderEditor({ template, templates: [template] });

    expect(screen.getByRole('textbox', { name: 'template_editor_title_field_label' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'template_editor_content_field_label' })).toBeDisabled();

    await userEvent.click(screen.getByRole('switch', { name: 'template_editor_enabled_label' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'template_editor_shortcut_field_label' }), 'p');
    await userEvent.click(screen.getByRole('button', { name: 'template_editor_save_button' }));

    await waitFor(() => expect(service.updateTemplate).toHaveBeenCalledTimes(1));
    expect(service.updateTemplate).toHaveBeenCalledWith(template.id, { enabled: false, shortcut: 'P' });
  });

  it('shows field errors after blur and keeps save disabled while invalid', async () => {
    renderEditor();

    await userEvent.click(screen.getByRole('textbox', { name: 'template_editor_title_field_label' }));
    await userEvent.tab();
    await userEvent.click(screen.getByRole('textbox', { name: 'template_editor_content_field_label' }));
    await userEvent.tab();

    expect(screen.getByText('template_editor_error_title_required')).toBeInTheDocument();
    expect(screen.getByText('template_editor_error_content_required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'template_editor_save_button' })).toBeDisabled();
  });

  it('confirms and deletes an editable template', async () => {
    const template = createUserTemplate();
    const { onClose, onSaved, service } = renderEditor({ template, templates: [template] });

    await userEvent.click(screen.getByRole('button', { name: 'template_editor_delete_button' }));

    expect(screen.getByRole('dialog', { name: 'template_editor_delete_confirm_title' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'template_editor_delete_confirm_button' }));

    await waitFor(() => expect(service.removeTemplates).toHaveBeenCalledWith([template.id]));
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { TemplateImportDialog } from 'extension/ui/options/component/template-import-dialog/template-import-dialog';

const parsedTemplates = [
  { content: 'First content', description: 'First description', enabled: true, shortcut: 'F', title: 'First' },
  { content: 'Second content', description: null, enabled: false, shortcut: null, title: 'Second' },
];

const renderImportDialog = () => {
  const onClose = vi.fn();
  const onImported = vi.fn(async () => undefined);
  const templateService = {
    importTemplates: vi.fn(async () => []),
    parseTemplates: vi.fn(() => parsedTemplates),
  };

  renderUi(<TemplateImportDialog open onClose={onClose} onImported={onImported} />, {
    contexts: { templateService },
  });

  return { onClose, onImported, templateService };
};

describe('TemplateImportDialog', () => {
  it('keeps reading disabled until source has non-whitespace content', async () => {
    renderImportDialog();

    expect(screen.getByRole('button', { name: 'template_import_read_button' })).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: 'template_import_field_label' }), '   ');

    expect(screen.getByRole('button', { name: 'template_import_read_button' })).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: 'template_import_field_label' }), 'encoded');

    expect(screen.getByRole('button', { name: 'template_import_read_button' })).toBeEnabled();
  });

  it('parses pasted source for review and imports only selected templates in original order', async () => {
    const { onClose, onImported, templateService } = renderImportDialog();

    await userEvent.type(screen.getByRole('textbox', { name: 'template_import_field_label' }), 'encoded export');
    await userEvent.click(screen.getByRole('button', { name: 'template_import_read_button' }));

    expect(templateService.parseTemplates).toHaveBeenCalledWith('encoded export');
    expect(screen.getByText('template_import_review_description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /First/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Second/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /First/ }));
    await userEvent.click(screen.getByRole('button', { name: 'template_import_submit_button' }));

    await waitFor(() => expect(templateService.importTemplates).toHaveBeenCalledWith([parsedTemplates[1]]));
    expect(onImported).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns to source view without importing', async () => {
    const { templateService } = renderImportDialog();

    await userEvent.type(screen.getByRole('textbox', { name: 'template_import_field_label' }), 'encoded export');
    await userEvent.click(screen.getByRole('button', { name: 'template_import_read_button' }));
    await userEvent.click(screen.getByRole('button', { name: 'template_import_back_button' }));

    expect(screen.getByRole('textbox', { name: 'template_import_field_label' })).toHaveValue('encoded export');
    expect(templateService.importTemplates).not.toHaveBeenCalled();
  });

  it('shows a contextual error when parsing fails', async () => {
    const { templateService } = renderImportDialog();
    templateService.parseTemplates.mockImplementationOnce(() => {
      throw new Error('Nope');
    });

    await userEvent.type(screen.getByRole('textbox', { name: 'template_import_field_label' }), 'broken');
    await userEvent.click(screen.getByRole('button', { name: 'template_import_read_button' }));

    expect(screen.getByText('error_snackbar_unknown_message')).toBeInTheDocument();
    expect(screen.queryByText('template_import_review_description')).not.toBeInTheDocument();
  });
});

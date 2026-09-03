import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderUi } from 'extension/test/ui';
import { TemplateExportDialog } from 'extension/ui/options/component/template-export-dialog/template-export-dialog';
import { createUserTemplate } from 'extension/ui/options/test-fixtures';

const renderExportDialog = (templates = [createUserTemplate()]) => {
  const onClose = vi.fn();
  const templateService = { exportTemplates: vi.fn(() => 'encoded-export') };

  renderUi(<TemplateExportDialog open onClose={onClose} templates={templates} />, {
    contexts: { templateService },
  });

  return { onClose, templateService };
};

describe('TemplateExportDialog', () => {
  it('renders the exported value as read-only text', () => {
    const template = createUserTemplate({ id: 'export-me' });
    const { templateService } = renderExportDialog([template]);

    expect(templateService.exportTemplates).toHaveBeenCalledWith([template]);
    expect(screen.getByRole('textbox', { name: 'template_export_field_label' })).toHaveValue('encoded-export');
  });

  it('disables copy and download when no templates are selected', () => {
    const { templateService } = renderExportDialog([]);

    expect(templateService.exportTemplates).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'template_export_copy_button' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'template_export_save_file_button' })).toBeDisabled();
  });

  it('copies the encoded export and shows confirmation', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderExportDialog();

    await userEvent.click(screen.getByRole('button', { name: 'template_export_copy_button' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('encoded-export'));
    expect(screen.getByText('template_export_copied_message')).toBeInTheDocument();
  });

  it('shows a contextual error when copying fails', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn(async () => Promise.reject(new Error('Denied'))) },
    });
    renderExportDialog();

    await userEvent.click(screen.getByRole('button', { name: 'template_export_copy_button' }));

    expect(await screen.findByText('error_snackbar_unknown_message')).toBeInTheDocument();
  });
});

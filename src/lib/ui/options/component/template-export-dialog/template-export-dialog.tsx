import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { Template } from 'extension/template/template.model';
import { useTemplates } from 'extension/template/templates.context';
import { getErrorMessage } from 'extension/ui/options/component/options-error.utils';

const exportFileName = 'templates.json';

/**
 * Exports the given templates as a base64-encoded document that can be copied to the clipboard or saved to a file,
 * replacing the legacy options page "export wizard".
 *
 * This is mounted only while open, exporting whatever templates were selected in the grid at the time.
 */
export function TemplateExportDialog({ onClose, open, templates }: TemplateExportDialogProps) {
  const intl = useIntl();
  const templateService = useTemplates();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);

  const value = useMemo(
    () => (templates.length ? templateService.exportTemplates(templates) : ''),
    [templates, templateService],
  );

  const handleCopy = useCallback(async () => {
    setError(undefined);

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (e) {
      setError(getErrorMessage(e, intl));
    }
  }, [intl, value]);

  const handleDownload = useCallback(() => {
    setError(undefined);

    try {
      const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
      const link = document.createElement('a');

      link.download = exportFileName;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      setError(getErrorMessage(e, intl));
    }
  }, [intl, value]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{intl.getMessage('template_export_title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(undefined)}>
                {error}
              </Alert>
            )}
            <DialogContentText>{intl.getMessage('template_export_description')}</DialogContentText>
            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={8}
              label={intl.getMessage('template_export_field_label')}
              value={value}
              helperText={intl.getMessage('template_export_field_helper_text')}
              slotProps={{ htmlInput: { readOnly: true, spellCheck: false, style: { fontFamily: 'monospace' } } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{intl.getMessage('template_export_close_button')}</Button>
          <Button variant="outlined" disabled={!value} onClick={handleDownload}>
            {intl.getMessage('template_export_save_file_button')}
          </Button>
          <Button variant="contained" disabled={!value} onClick={handleCopy}>
            {intl.getMessage('template_export_copy_button')}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        message={intl.getMessage('template_export_copied_message')}
        onClose={() => setCopied(false)}
      />
    </>
  );
}

export type TemplateExportDialogProps = {
  onClose: () => void;
  open: boolean;
  /**
   * The templates selected within the grid to be exported.
   */
  templates: readonly Template[];
};

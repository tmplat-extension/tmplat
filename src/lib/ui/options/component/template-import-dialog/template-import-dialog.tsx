import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ChangeEvent, useCallback, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { TemplateTransferTemplate } from 'extension/template/template-transfer.model';
import { useTemplates } from 'extension/template/templates.context';
import { getErrorMessage } from 'extension/ui/options/component/options-error.utils';

/**
 * Imports templates from a base64-encoded document, either pasted directly or loaded from a file, replacing the legacy
 * options page "import wizard".
 *
 * Parsing is deliberately separate from importing so that the user can review what a document contains and import only
 * a subset of it.
 *
 * This is mounted only while open so that it is always started afresh.
 */
export function TemplateImportDialog({ onClose, onImported, open }: TemplateImportDialogProps) {
  const intl = useIntl();
  const templateService = useTemplates();
  const [error, setError] = useState<string>();
  const [importing, setImporting] = useState(false);
  const [view, setView] = useState<'source' | 'review'>('source');
  const [source, setSource] = useState('');
  const [parsedTemplates, setParsedTemplates] = useState<TemplateTransferTemplate[]>();
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const handleParse = useCallback(
    (value: string) => {
      setError(undefined);

      try {
        const templates = templateService.parseTemplates(value);

        setParsedTemplates(templates);
        setSelectedIndexes(templates.map((_template, index) => index));
        setView('review');
      } catch (e) {
        setParsedTemplates(undefined);
        setSelectedIndexes([]);
        setError(getErrorMessage(e, intl));
      }
    },
    [intl, templateService],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Allows the same file to be selected again after being cleared
      event.target.value = '';

      if (!file) {
        return;
      }

      try {
        const value = await file.text();

        setSource(value);
        handleParse(value);
      } catch (e) {
        setError(getErrorMessage(e, intl));
      }
    },
    [handleParse, intl],
  );

  const handleImport = useCallback(async () => {
    if (!parsedTemplates) {
      return;
    }

    setError(undefined);
    setImporting(true);

    try {
      await templateService.importTemplates(
        selectedIndexes
          .slice()
          .sort((a, b) => a - b)
          .map((index) => parsedTemplates[index]),
      );

      await onImported();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, intl));
    } finally {
      setImporting(false);
    }
  }, [intl, onClose, onImported, parsedTemplates, selectedIndexes, templateService]);

  const toggleSelected = (index: number) => {
    setSelectedIndexes(
      selectedIndexes.includes(index)
        ? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
        : [...selectedIndexes, index],
    );
  };

  const handleBack = useCallback(() => {
    setError(undefined);
    setView('source');
  }, []);

  const canRead = !!source.trim();
  const canImport = !!parsedTemplates && !!selectedIndexes.length && !importing;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{intl.getMessage('template_import_title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(undefined)}>
              {error}
            </Alert>
          )}
          {view === 'source' ? (
            <>
              <DialogContentText>{intl.getMessage('template_import_source_description')}</DialogContentText>
              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
                label={intl.getMessage('template_import_field_label')}
                value={source}
                slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace' } } }}
                onChange={(event) => {
                  setSource(event.target.value);
                  setParsedTemplates(undefined);
                  setSelectedIndexes([]);
                }}
              />
            </>
          ) : (
            parsedTemplates && (
              <>
                <DialogContentText>{intl.getMessage('template_import_review_description')}</DialogContentText>
                <List dense sx={{ maxHeight: 240, overflow: 'auto' }}>
                  {parsedTemplates.map((template, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton onClick={() => toggleSelected(index)}>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            tabIndex={-1}
                            disableRipple
                            checked={selectedIndexes.includes(index)}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={template.title}
                          secondary={template.description || template.content}
                          slotProps={{ secondary: { noWrap: true } }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </>
            )
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{intl.getMessage('template_import_cancel_button')}</Button>
        {view === 'source' ? (
          <>
            <Button variant="outlined" component="label">
              {intl.getMessage('template_import_choose_file_button')}
              <input type="file" hidden accept=".json,.txt,application/json,text/plain" onChange={handleFileChange} />
            </Button>
            <Button variant="contained" disabled={!canRead} onClick={() => handleParse(source)}>
              {intl.getMessage('template_import_read_button')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBack}>{intl.getMessage('template_import_back_button')}</Button>
            <Button variant="contained" disabled={!canImport} onClick={handleImport}>
              {intl.getMessage('template_import_submit_button')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export type TemplateImportDialogProps = {
  onClose: () => void;
  onImported: () => Promise<void> | void;
  open: boolean;
};

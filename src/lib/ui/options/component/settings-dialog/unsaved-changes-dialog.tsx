import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useIntl } from 'extension/common/intl/intl.context';

/**
 * Prompt shown when the user attempts to close the settings dialog with unsaved changes, allowing them to cancel the
 * closure, discard the changes and close, or save the changes and close.
 */
export function UnsavedChangesDialog({ onCancel, onDiscard, onSave, open, saving }: UnsavedChangesDialogProps) {
  const intl = useIntl();

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{intl.getMessage('settings_dialog_unsaved_changes_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{intl.getMessage('settings_dialog_unsaved_changes_content')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={onCancel}>
          {intl.getMessage('settings_dialog_unsaved_changes_cancel_button')}
        </Button>
        <Button color="error" disabled={saving} onClick={onDiscard}>
          {intl.getMessage('settings_dialog_unsaved_changes_discard_button')}
        </Button>
        <Button autoFocus variant="contained" disabled={saving} onClick={onSave}>
          {intl.getMessage('settings_dialog_unsaved_changes_save_button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export type UnsavedChangesDialogProps = {
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
  open: boolean;
  /**
   * Whether the save operation triggered by `onSave` is currently in progress, used to disable the actions while it
   * completes.
   */
  saving?: boolean;
};

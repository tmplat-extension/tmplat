import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { ReactNode } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';

/**
 * Simple confirmation prompt used before any destructive action (e.g. deleting templates).
 */
export function ConfirmDialog({
  cancelText,
  confirmText,
  content,
  destructive,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  const intl = useIntl();

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelText ?? intl.getMessage('confirm_dialog_cancel_button')}</Button>
        <Button autoFocus color={destructive ? 'error' : 'primary'} variant="contained" onClick={onConfirm}>
          {confirmText ?? intl.getMessage('confirm_dialog_confirm_button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export type ConfirmDialogProps = {
  cancelText?: string;
  confirmText?: string;
  content: ReactNode;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: ReactNode;
};

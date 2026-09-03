import Alert from '@mui/material/Alert';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import { SyntheticEvent, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';

const getMessage = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error) {
    if ('stack' in error && typeof error.stack === 'string' && error.stack) {
      return error.stack;
    }
    if ('message' in error && typeof error.message === 'string' && error.message) {
      return error.message;
    }
  }
  return;
};

export function ErrorSnackbar({ error }: ErrorSnackbarProps) {
  const intl = useIntl();
  const [open, setOpen] = useState(true);

  const message = getMessage(error) || intl.getMessage('error_snackbar_unknown_message');

  const handleClose = (_event?: SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason !== 'clickaway') {
      setOpen(false);
    }
  };

  // TODO: add collapsible code block with stack
  return (
    <Snackbar open={open}>
      <Alert severity="error" variant="filled" onClose={handleClose} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export type ErrorSnackbarProps = {
  error: unknown;
};

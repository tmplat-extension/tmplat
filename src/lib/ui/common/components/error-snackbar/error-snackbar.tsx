import Alert from '@mui/material/Alert';
import Snackbar, { type SnackbarCloseReason } from '@mui/material/Snackbar';
import { type SyntheticEvent, useState } from 'react';
import { useErrorMessage } from 'extension/ui/common/hooks/use-error-message';

export function ErrorSnackbar({ error }: ErrorSnackbarProps) {
  const getErrorMessage = useErrorMessage();
  const [open, setOpen] = useState(true);

  const message = getErrorMessage(error);

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

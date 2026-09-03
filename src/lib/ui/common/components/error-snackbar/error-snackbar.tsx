import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Snackbar, { type SnackbarCloseReason } from '@mui/material/Snackbar';
import { type SyntheticEvent, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { useErrorDetail } from 'extension/ui/common/hooks/use-error-detail';

// `action.hover` is tuned for the default surface and is all but invisible against a filled error alert
const CODE_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.24)';

export function ErrorSnackbar({ error }: ErrorSnackbarProps) {
  const getErrorDetail = useErrorDetail();
  const intl = useIntl();
  const [open, setOpen] = useState(true);
  const [stackExpanded, setStackExpanded] = useState(false);

  const detail = getErrorDetail(error);

  const handleClose = (_event?: SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason !== 'clickaway') {
      setOpen(false);
    }
  };

  return (
    <Snackbar open={open} sx={{ maxWidth: '100%' }}>
      <Alert severity="error" variant="filled" onClose={handleClose} sx={{ width: '100%' }}>
        <AlertTitle sx={{ mb: 0.5 }}>{detail.message}</AlertTitle>
        <Box
          component="code"
          aria-label={intl.getMessage('error_snackbar_code_label')}
          sx={{
            bgcolor: CODE_BACKGROUND_COLOR,
            borderRadius: 1,
            display: 'inline-block',
            fontFamily: 'monospace',
            fontSize: '0.8125rem',
            px: 0.75,
            py: 0.25,
          }}
        >
          {detail.code}
        </Box>
        {detail.stack && (
          <>
            <Box>
              <Button
                aria-expanded={stackExpanded}
                color="inherit"
                size="small"
                startIcon={stackExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setStackExpanded((expanded) => !expanded)}
                sx={{ ml: -1, mt: 0.5 }}
              >
                {intl.getMessage('error_snackbar_stack_button')}
              </Button>
            </Box>
            <Collapse in={stackExpanded} unmountOnExit>
              <Box
                component="pre"
                sx={{
                  bgcolor: CODE_BACKGROUND_COLOR,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  m: 0,
                  // A stack can be arbitrarily long, so it scrolls rather than growing the snackbar off-screen
                  maxHeight: 200,
                  overflow: 'auto',
                  px: 1.5,
                  py: 1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {detail.stack}
              </Box>
            </Collapse>
          </>
        )}
      </Alert>
    </Snackbar>
  );
}

export type ErrorSnackbarProps = {
  error: unknown;
};

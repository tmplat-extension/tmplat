import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { type ReactNode } from 'react';

/**
 * A single centred message used for every terminal state of the migrate page that has no step detail to show -
 * already migrated, opened without a version, or a failure while working out what needs migrating.
 *
 * These states share a component because they are indistinguishable to the user in everything but wording: each is
 * a dead end with at most one way forward.
 */
export function MigrationNotice({ actions, message, severity, title }: MigrationNoticeProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <Stack spacing={2} sx={{ maxWidth: 'sm', width: '100%' }}>
        <Alert severity={severity}>
          <AlertTitle>{title}</AlertTitle>
          {message}
        </Alert>
        {actions && (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export type MigrationNoticeProps = {
  readonly actions?: ReactNode;
  readonly message: string;
  readonly severity: 'error' | 'info' | 'success' | 'warning';
  readonly title: string;
};

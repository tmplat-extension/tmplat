import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

/**
 * Consistent layout for a titled group of related settings controls.
 */
export function SettingsSection({ action, children, description, title }: SettingsSectionProps) {
  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 'medium' }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
      <Divider sx={{ mb: 2, mt: 1 }} />
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}

export type SettingsSectionProps = {
  /**
   * Optional control rendered at the far right of the section header.
   */
  action?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  title: ReactNode;
};

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { type DataMigrationManagerRequiredMigrations } from 'extension/common/data/migration/data-migration-manager';
import { useDataMigrations } from 'extension/common/data/migration/data-migrations.context';
import { useIntl } from 'extension/common/intl/intl.context';
import { useErrorDetail } from 'extension/ui/common/hooks/use-error-detail';

const exportFileName = 'tmplat-legacy-data.json';

/**
 * Shows exactly what a migration will do *before* it touches anything, and offers a backup of the legacy data.
 *
 * The extension used to migrate on page load, which meant destructive steps ran before the user had seen the page -
 * and, since several steps delete the legacy key once it has been read, there was no way back.
 */
export function MigrationPreview({ onStart, requiredMigrations }: MigrationPreviewProps) {
  const dataMigrationManager = useDataMigrations();
  const getErrorDetail = useErrorDetail({ messageKey: 'migrate_error_fallback' });
  const intl = useIntl();
  const [error, setError] = useState<string>();
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setError(undefined);
    setExporting(true);

    try {
      const legacyData = await dataMigrationManager.exportLegacyData();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(legacyData, undefined, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');

      link.download = exportFileName;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      setError(getErrorDetail(e).message);
    } finally {
      setExporting(false);
    }
  }, [dataMigrationManager, getErrorDetail]);

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
      <Typography>{intl.getMessage('migrate_preview_description', intl.getMessage('name'))}</Typography>
      {requiredMigrations.migrations.map(({ namespaces, version }) => (
        <Card key={version} variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              {intl.getMessage('migrate_preview_version_heading', version)}
            </Typography>
            {namespaces.map(({ namespace, namespaceTitle, steps }) => (
              <Stack key={namespace} spacing={0.5} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" component="h3">
                  {namespaceTitle}
                </Typography>
                <List dense disablePadding>
                  {steps.map((step) => (
                    <ListItem key={step} disableGutters sx={{ py: 0 }}>
                      <ListItemText primary={step} />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            ))}
          </CardContent>
        </Card>
      ))}
      <Alert severity="info">{intl.getMessage('migrate_preview_export_hint')}</Alert>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={handleExport} loading={exporting}>
          {intl.getMessage('migrate_preview_export_button')}
        </Button>
        <Button variant="contained" onClick={onStart}>
          {intl.getMessage('migrate_preview_start_button')}
        </Button>
      </Stack>
    </Stack>
  );
}

export type MigrationPreviewProps = {
  readonly onStart: () => void;
  readonly requiredMigrations: DataMigrationManagerRequiredMigrations;
};

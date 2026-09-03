import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type DataMigrationManagerMigrateResult,
  type DataMigrationManagerRequiredMigrations,
} from 'extension/common/data/migration/data-migration-manager';
import { useDataMigrations } from 'extension/common/data/migration/data-migrations.context';
import { ExtensionError } from 'extension/common/error/extension-error';
import { useIntl } from 'extension/common/intl/intl.context';
import { useLogger } from 'extension/common/logging/logging.context';
import { useAppearanceResolvedMode } from 'extension/ui/common/hooks/use-appearance-resolved-mode';
import { useErrorDetail } from 'extension/ui/common/hooks/use-error-detail';
import { MigrationNotice } from 'extension/ui/migrate/component/migration-notice/migration-notice';
import { MigrationPreview } from 'extension/ui/migrate/component/migration-preview/migration-preview';
import { MigrationResults } from 'extension/ui/migrate/component/migration-results/migration-results';

/**
 * Raised by `DataMigrationManager` when there is nothing left to migrate. This is the normal state of a *reloaded*
 * migrate page, not a failure, so it gets its own screen.
 */
const alreadyMigratedCode = 'MIG409000';
/**
 * Raised when the page was opened without the `version` query parameter identifying what to migrate from.
 */
const missingVersionCode = 'MIG404000';

type Stage =
  | { readonly name: 'loading' }
  | { readonly name: 'preview'; readonly requiredMigrations: DataMigrationManagerRequiredMigrations }
  | { readonly name: 'migrating' }
  | { readonly name: 'results'; readonly result: DataMigrationManagerMigrateResult }
  | { readonly name: 'already-migrated' }
  | { readonly name: 'missing-version' }
  | { readonly name: 'error'; readonly error: unknown };

const toStage = (error: unknown): Stage => {
  if (error instanceof ExtensionError) {
    if (error.code === alreadyMigratedCode) {
      return { name: 'already-migrated' };
    }
    if (error.code === missingVersionCode) {
      return { name: 'missing-version' };
    }
  }

  return { error, name: 'error' };
};

/**
 * Drives the migrate page.
 *
 * Migration is deliberately **not** started on mount. The page previously ran the whole migration before its first
 * paint, which meant destructive steps had already happened by the time the user saw anything - and, because
 * `migrate()` rejects once a migration is complete, a reload then rendered a permanently blank tab.
 */
export function App() {
  const dataMigrationManager = useDataMigrations();
  const getErrorDetail = useErrorDetail({ messageKey: 'migrate_error_fallback' });
  const intl = useIntl();
  const logger = useLogger('MigrateApp');
  const resolvedMode = useAppearanceResolvedMode();
  const [stage, setStage] = useState<Stage>({ name: 'loading' });

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedMode,
        },
      }),
    [resolvedMode],
  );

  useEffect(() => {
    document.title = intl.getMessage('page_title_migrate', intl.getMessage('name'));
  }, [intl]);

  useEffect(() => {
    let active = true;

    dataMigrationManager
      .getRequiredMigrations()
      .then((requiredMigrations) => {
        if (active) {
          setStage({ name: 'preview', requiredMigrations });
        }
      })
      // A trailing `catch` rather than a second `then` argument, so that a failure while *setting state* is not
      // silently swallowed by a sibling rejection handler.
      .catch((e: unknown) => {
        if (active) {
          logger.error('Failed to determine what needs migrating:', e);
          setStage(toStage(e));
        }
      });

    return () => {
      active = false;
    };
  }, [dataMigrationManager, logger]);

  const runMigration = useCallback(
    (migrate: () => Promise<DataMigrationManagerMigrateResult>) => {
      setStage({ name: 'migrating' });

      migrate()
        .then((result) => setStage({ name: 'results', result }))
        .catch((e: unknown) => {
          logger.error('Failed to migrate:', e);
          setStage(toStage(e));
        });
    },
    [logger],
  );

  const handleStart = useCallback(
    () => runMigration(async () => dataMigrationManager.migrate()),
    [dataMigrationManager, runMigration],
  );

  const handleRetry = useCallback(() => {
    if (stage.name !== 'results') {
      return;
    }

    const { version } = stage.result;

    runMigration(async () => dataMigrationManager.retryMigration(version));
  }, [dataMigrationManager, runMigration, stage]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h1">
            {intl.getMessage('migrate_heading', intl.getMessage('name'))}
          </Typography>
          {stage.name === 'loading' && (
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, justifyContent: 'center', p: 3 }}>
              <CircularProgress />
              <Typography>{intl.getMessage('migrate_loading')}</Typography>
            </Box>
          )}
          {stage.name === 'preview' && (
            <MigrationPreview requiredMigrations={stage.requiredMigrations} onStart={handleStart} />
          )}
          {stage.name === 'migrating' && (
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, justifyContent: 'center', p: 3 }}>
              <CircularProgress />
              <Typography>{intl.getMessage('migrate_progress_message')}</Typography>
            </Box>
          )}
          {stage.name === 'results' && <MigrationResults results={stage.result.results} onRetry={handleRetry} />}
          {stage.name === 'already-migrated' && (
            <MigrationNotice
              severity="success"
              title={intl.getMessage('migrate_already_complete_title')}
              message={intl.getMessage('migrate_already_complete_message')}
              actions={
                <Button variant="contained" onClick={async () => browser.runtime.openOptionsPage()}>
                  {intl.getMessage('migrate_options_button')}
                </Button>
              }
            />
          )}
          {stage.name === 'missing-version' && (
            <MigrationNotice
              severity="info"
              title={intl.getMessage('migrate_unavailable_title')}
              message={intl.getMessage('migrate_unavailable_message')}
            />
          )}
          {stage.name === 'error' && (
            <MigrationNotice
              severity="error"
              title={intl.getMessage('migrate_error_title')}
              message={getErrorDetail(stage.error).message}
            />
          )}
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useMemo, useState } from 'react';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import {
  type DataMigrationResult,
  type DataMigrationStepLegacyDataKey,
} from 'extension/common/data/migration/data-migration.model';
import { useDataMigrations } from 'extension/common/data/migration/data-migrations.context';
import { useIntl } from 'extension/common/intl/intl.context';
import { useLogger } from 'extension/common/logging/logging.context';
import { useErrorDetail } from 'extension/ui/common/hooks/use-error-detail';
import { MigrationStepList } from 'extension/ui/migrate/component/migration-step-list/migration-step-list';

const countSteps = (result: DataMigrationResult): Record<DataMigrationStepOutcome, number> =>
  (result.steps ?? []).reduce(
    (acc, step) => {
      acc[step.outcome]++;
      return acc;
    },
    {
      [DataMigrationStepOutcome.Failed]: 0,
      [DataMigrationStepOutcome.Passed]: 0,
      [DataMigrationStepOutcome.Skipped]: 0,
    } as Record<DataMigrationStepOutcome, number>,
  );

/**
 * Reports what a migration actually did, per data namespace and per step.
 *
 * A namespace outcome of `Completed` only means the migrator *ran* - it says nothing about whether its steps
 * succeeded - so failure is derived from the step outcomes as well as the namespace outcome. Treating `Completed`
 * as success would make a migration in which every step failed indistinguishable from a clean one.
 */
export function MigrationResults({ onRetry, results }: MigrationResultsProps) {
  const dataMigrationManager = useDataMigrations();
  const getErrorDetail = useErrorDetail({ messageKey: 'migrate_error_fallback' });
  const intl = useIntl();
  const logger = useLogger('MigrationResults');
  const [error, setError] = useState<string>();
  const [discarding, setDiscarding] = useState(false);

  const failed = useMemo(
    () =>
      results.some(
        (result) =>
          result.outcome === DataMigrationOutcome.Failed ||
          (result.steps ?? []).some((step) => step.outcome === DataMigrationStepOutcome.Failed),
      ),
    [results],
  );
  const unknown = useMemo(
    () => results.length > 0 && results.every((result) => result.outcome === DataMigrationOutcome.Unknown),
    [results],
  );
  const discardableLegacyData = useMemo(
    () =>
      results.flatMap((result) =>
        (result.steps ?? []).flatMap((step) =>
          (step.legacy ?? []).map(({ key, storage }): DataMigrationStepLegacyDataKey => ({ key, storage })),
        ),
      ),
    [results],
  );

  const handleDiscardAndRetry = useCallback(async () => {
    setError(undefined);
    setDiscarding(true);

    try {
      await dataMigrationManager.removeLegacyData(discardableLegacyData);

      onRetry();
    } catch (e) {
      logger.error('Failed to discard the legacy data blocking the migration:', e);
      setError(getErrorDetail(e).message);
    } finally {
      setDiscarding(false);
    }
  }, [dataMigrationManager, discardableLegacyData, getErrorDetail, logger, onRetry]);

  if (unknown) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">
          <AlertTitle>{intl.getMessage('migrate_results_unknown_title')}</AlertTitle>
          {intl.getMessage('migrate_results_unknown_message')}
        </Alert>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          {/*
           * Deliberately a secondary action rather than the primary one. The migration may genuinely be running in
           * another tab, and retrying resets the phase so both runs could then proceed concurrently, so the user is
           * asked to rule that out first. Without this the screen has no action at all, which strands anyone whose
           * previous attempt was interrupted - by far the more common cause.
           */}
          <Button color="warning" onClick={onRetry}>
            {intl.getMessage('migrate_results_unknown_retry_button')}
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
      <Alert severity={failed ? 'warning' : 'success'}>
        <AlertTitle>
          {intl.getMessage(failed ? 'migrate_results_failure_title' : 'migrate_results_success_title')}
        </AlertTitle>
        {intl.getMessage(failed ? 'migrate_results_failure_message' : 'migrate_results_success_message')}
      </Alert>
      {results.map((result) => {
        const counts = countSteps(result);

        return (
          <Card key={result.namespace} variant="outlined">
            <CardContent>
              <Typography variant="h6" component="h2">
                {intl.getMessage(`data_namespace_${result.namespace}`)}
              </Typography>
              {result.outcome === DataMigrationOutcome.Failed ? (
                <Alert severity="error" sx={{ mt: 1 }}>
                  <AlertTitle>{intl.getMessage('migrate_results_namespace_failed')}</AlertTitle>
                  {getErrorDetail(result.error).message}
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {intl.getMessage(
                      'migrate_results_step_summary',
                      String(counts[DataMigrationStepOutcome.Passed]),
                      String(counts[DataMigrationStepOutcome.Skipped]),
                      String(counts[DataMigrationStepOutcome.Failed]),
                    )}
                  </Typography>
                  <MigrationStepList steps={result.steps ?? []} />
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        {failed && discardableLegacyData.length > 0 && (
          <Button color="warning" onClick={handleDiscardAndRetry} loading={discarding}>
            {intl.getMessage('migrate_legacy_data_discard_button')}
          </Button>
        )}
        {failed && (
          <Button variant="contained" onClick={onRetry}>
            {intl.getMessage('migrate_results_retry_button')}
          </Button>
        )}
        {!failed && (
          <Button
            variant="contained"
            onClick={async () => {
              setError(undefined);

              try {
                await browser.runtime.openOptionsPage();
              } catch (e) {
                logger.error('Failed to open options page:', e);
                setError(getErrorDetail(e).message);
              }
            }}
          >
            {intl.getMessage('migrate_options_button')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

export type MigrationResultsProps = {
  readonly onRetry: () => void;
  readonly results: readonly DataMigrationResult[];
};

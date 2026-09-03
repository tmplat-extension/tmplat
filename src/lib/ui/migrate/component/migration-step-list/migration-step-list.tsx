import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationStepResult } from 'extension/common/data/migration/data-migration.model';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { useIntl } from 'extension/common/intl/intl.context';
import { useErrorDetail } from 'extension/ui/common/hooks/use-error-detail';

const outcomeMessageKeys: Record<DataMigrationStepOutcome, IntlMessageKey> = {
  [DataMigrationStepOutcome.Failed]: 'migrate_step_outcome_failed',
  [DataMigrationStepOutcome.Passed]: 'migrate_step_outcome_passed',
  [DataMigrationStepOutcome.Skipped]: 'migrate_step_outcome_skipped',
};

function StepIcon({ outcome }: { readonly outcome: DataMigrationStepOutcome }) {
  switch (outcome) {
    case DataMigrationStepOutcome.Failed:
      return <CancelIcon color="error" />;
    case DataMigrationStepOutcome.Skipped:
      return <RemoveCircleIcon color="disabled" />;
    default:
      return <CheckCircleIcon color="success" />;
  }
}

/**
 * Renders the outcome of every step a migrator ran, so that a namespace reporting `Completed` can still be seen to
 * contain failures - the outcome of the namespace only says that it *ran*.
 *
 * The legacy data carried by a failed step is shown verbatim: it is the user's own 1.x data, and the only reason it
 * survived the migration is that nothing could make sense of it, so there is nothing more useful to render.
 */
export function MigrationStepList({ steps }: MigrationStepListProps) {
  const getErrorDetail = useErrorDetail({ messageKey: 'migrate_error_fallback' });
  const intl = useIntl();

  return (
    <List dense disablePadding>
      {steps.map((step, index) => (
        // Steps have no stable identity beyond their position: two steps of the same migrator can legitimately
        // share a description, and the list is never reordered or filtered.
        // oxlint-disable-next-line react/no-array-index-key
        <ListItem key={index} alignItems="flex-start" disableGutters>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <StepIcon outcome={step.outcome} />
          </ListItemIcon>
          <ListItemText
            primary={step.description}
            // The secondary content holds alerts and preformatted blocks, and MUI renders it as a `<p>` by default,
            // which cannot legally contain them.
            slotProps={{ secondary: { component: 'div' } }}
            secondary={
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {intl.getMessage(outcomeMessageKeys[step.outcome])}
                </Typography>
                {step.reasons?.map((reason) => (
                  <Typography key={reason} variant="body2" color="text.secondary">
                    {reason}
                  </Typography>
                ))}
                {step.errors?.map((error) => (
                  <Alert key={error.code} severity="error" variant="outlined">
                    {getErrorDetail(error).message}
                  </Alert>
                ))}
                {step.legacy?.length ? (
                  <Alert severity="warning" variant="outlined">
                    <AlertTitle>{intl.getMessage('migrate_legacy_data_heading')}</AlertTitle>
                    <Typography variant="body2">{intl.getMessage('migrate_legacy_data_description')}</Typography>
                    {step.legacy.map(({ data, key, storage }) => (
                      <Typography
                        key={`${storage}:${key}`}
                        component="pre"
                        variant="body2"
                        sx={{ mt: 1, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                      >
                        {`${storage}:${key} = ${JSON.stringify(data)}`}
                      </Typography>
                    ))}
                  </Alert>
                ) : null}
              </Stack>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

export type MigrationStepListProps = {
  readonly steps: readonly DataMigrationStepResult[];
};

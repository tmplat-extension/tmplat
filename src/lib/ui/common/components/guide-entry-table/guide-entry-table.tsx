import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useIntl } from 'extension/common/intl/intl.context';
import { GuideEntry } from 'extension/ui/common/components/guide/guide.model';
import { GuideCode } from 'extension/ui/common/components/guide-code/guide-code';

/**
 * Renders the entries of a single category as a table, dynamically driven by the template context entry definitions.
 */
export function GuideEntryTable({ entries, typeHeader }: GuideEntryTableProps) {
  const intl = useIntl();

  if (!entries.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        {intl.getMessage('guide_entry_table_no_entries_message')}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '28%' }}>{intl.getMessage('guide_entry_table_name_header')}</TableCell>
            <TableCell sx={{ width: '22%' }}>{typeHeader}</TableCell>
            <TableCell>{intl.getMessage('guide_entry_table_description_header')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.name} hover>
              <TableCell sx={{ verticalAlign: 'top' }}>
                <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                  <GuideCode>{entry.name}</GuideCode>
                  {entry.aliases.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {intl.getMessage('guide_entry_table_aliases_message', entry.aliases.join(', '))}
                    </Typography>
                  )}
                  {entry.deprecated && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label={intl.getMessage('guide_entry_table_deprecated_chip_label', entry.deprecated)}
                    />
                  )}
                  {entry.sensitive && (
                    <Chip
                      size="small"
                      color="error"
                      variant="outlined"
                      label={intl.getMessage('guide_entry_table_sensitive_chip_label')}
                    />
                  )}
                </Stack>
              </TableCell>
              <TableCell sx={{ verticalAlign: 'top' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {entry.type}
                </Typography>
              </TableCell>
              <TableCell sx={{ verticalAlign: 'top' }}>
                <Typography variant="body2">{intl.getMessage(entry.descriptionKey)}</Typography>
                {entry.values && entry.values.length > 0 && (
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                    {intl.getMessage('guide_entry_table_values_message', entry.values.map(String).join(', '))}
                  </Typography>
                )}
                {entry.sensitive && (
                  <Typography variant="caption" color="error" component="div" sx={{ mt: 0.5 }}>
                    {intl.getMessage('guide_entry_table_sensitive_warning_message')}
                  </Typography>
                )}
                {entry.links.length > 0 && (
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                    {entry.links.map((link) => (
                      <Link key={link.href} href={link.href} target="_blank" rel="noreferrer" variant="caption">
                        {intl.getMessage(link.key)}
                      </Link>
                    ))}
                  </Stack>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export type GuideEntryTableProps = {
  entries: readonly GuideEntry[];
  typeHeader: string;
};

import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useChangelog } from 'extension/common/changelog/changelog.context';
import { Changelog as ChangelogModel, ChangelogEntry } from 'extension/common/changelog/changelog.model';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { useIntl } from 'extension/common/intl/intl.context';
import { InlineMarkdown } from 'extension/ui/common/components/inline-markdown/inline-markdown';

type ChangelogCategory = {
  readonly key: Exclude<keyof ChangelogEntry, 'date' | 'version'>;
  readonly titleKey: IntlMessageKey;
};

// Ordered by how notable each category is expected to be to a user reading the changelog after an update
const categories: ChangelogCategory[] = [
  { key: 'features', titleKey: 'changelog_category_features' },
  { key: 'improvements', titleKey: 'changelog_category_improvements' },
  { key: 'fixes', titleKey: 'changelog_category_fixes' },
  { key: 'knownIssues', titleKey: 'changelog_category_known_issues' },
];

function formatDate(date: string): string {
  const dateTime = DateTime.fromISO(date);

  return dateTime.isValid ? dateTime.toLocaleString(DateTime.DATE_FULL) : date;
}

/**
 * Renders every documented version, newest first.
 *
 * Individual changes may contain Markdown, so they are rendered as such.
 */
export function Changelog() {
  const changelogService = useChangelog();
  const intl = useIntl();
  const [changelog, setChangelog] = useState<ChangelogModel>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    changelogService
      .getChangelog()
      .then((entries) => {
        if (!cancelled) {
          setChangelog(entries);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [changelogService]);

  // The changelog is stored oldest to newest, but is most useful to a user in the opposite order
  const entries = useMemo(() => (changelog ? [...changelog].reverse() : []), [changelog]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar>
          <Typography component="h1" noWrap variant="h6">
            {intl.getMessage('changelog_title')}
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 3 }}>
        {failed && <Alert severity="error">{intl.getMessage('changelog_error')}</Alert>}
        {!failed && !changelog && (
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="body2">
              {intl.getMessage('changelog_loading')}
            </Typography>
            <LinearProgress />
          </Stack>
        )}
        {changelog && entries.length === 0 && (
          <Typography color="text.secondary">{intl.getMessage('changelog_empty')}</Typography>
        )}
        <Stack spacing={3}>
          {entries.map((entry) => (
            <Paper key={entry.version} sx={{ p: 3 }} variant="outlined">
              <Typography component="h2" variant="h5">
                {intl.getMessage('changelog_version_heading', entry.version)}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {formatDate(entry.date)}
              </Typography>
              {categories.map(({ key, titleKey }) => {
                const changes = entry[key];
                if (!changes?.length) {
                  return null;
                }

                return (
                  <Fragment key={key}>
                    <Divider sx={{ mt: 2 }} />
                    <Typography component="h3" sx={{ mt: 2 }} variant="subtitle1">
                      {intl.getMessage(titleKey)}
                    </Typography>
                    <List dense disablePadding sx={{ listStyleType: 'disc', pl: 3 }}>
                      {changes.map((change) => (
                        <ListItem key={change} disableGutters sx={{ display: 'list-item', py: 0.25 }}>
                          <ListItemText primary={<InlineMarkdown>{change}</InlineMarkdown>} />
                        </ListItem>
                      ))}
                    </List>
                  </Fragment>
                );
              })}
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

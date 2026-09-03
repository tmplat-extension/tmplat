import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { useAppearanceResolvedMode } from 'extension/ui/common/hooks/use-appearance-resolved-mode';
import OptionsAppBar from 'extension/ui/options/component/options-app-bar/options-app-bar';
import { TemplateDataGrid } from 'extension/ui/options/component/template-data-grid/template-data-grid';

export function App() {
  const intl = useIntl();
  const resolvedMode = useAppearanceResolvedMode();
  const [query, setQuery] = useState('');

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
    document.title = intl.getMessage('page_title_options', intl.getMessage('name'));
  }, [intl]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <OptionsAppBar query={query} onQueryChange={setQuery} />
        <TemplateDataGrid query={query} />
      </Box>
    </ThemeProvider>
  );
}

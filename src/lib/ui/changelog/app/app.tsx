import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useEffect, useMemo } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { Changelog } from 'extension/ui/common/components/changelog/changelog';
import { useAppearanceResolvedMode } from 'extension/ui/common/hooks/use-appearance-resolved-mode';

export function App() {
  const intl = useIntl();
  const resolvedMode = useAppearanceResolvedMode();

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
    document.title = intl.getMessage('page_title_changelog', intl.getMessage('name'));
  }, [intl]);

  return (
    <ThemeProvider theme={theme}>
      <Changelog />
    </ThemeProvider>
  );
}

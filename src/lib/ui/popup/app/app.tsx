import 'extension/ui/popup/app/app.scss';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useMemo } from 'react';
import { useAppearanceResolvedMode } from 'extension/ui/common/hooks/use-appearance-resolved-mode';
import { TemplateList } from 'extension/ui/popup/component/template-list/template-list';

export function App() {
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TemplateList />
    </ThemeProvider>
  );
}

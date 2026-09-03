import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useState } from 'react';
import { useAppearance } from 'extension/common/appearance/appearance.context';
import { AppearanceResolvedMode } from 'extension/common/appearance/appearance.service';

/**
 * Resolves the user's configured appearance mode (light/dark/system) to the concrete palette that MUI's
 * `ThemeProvider` should render, staying in sync with both the stored preference and the browser/OS preference so
 * that changes made in the settings view (or on another device/tab) are applied immediately without a reload.
 */
export function useAppearanceResolvedMode(): AppearanceResolvedMode {
  const appearanceService = useAppearance();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [resolvedMode, setResolvedMode] = useState<AppearanceResolvedMode>(prefersDarkMode ? 'dark' : 'light');

  useEffect(() => {
    let cancelled = false;

    appearanceService.getResolvedMode().then((mode) => {
      if (!cancelled) {
        setResolvedMode(mode);
      }
    });

    const unsubscribe = appearanceService.addResolvedModeChangeListener((mode) => {
      if (!cancelled) {
        setResolvedMode(mode);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [appearanceService]);

  return resolvedMode;
}

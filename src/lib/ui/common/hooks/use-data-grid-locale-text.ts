import { GridLocaleText } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import {
  getDefaultDataGridLocaleText,
  resolveDataGridLocaleText,
} from 'extension/ui/common/hooks/data-grid-locale-text-by-language';

/**
 * Resolves the `localeText` that should be passed to a MUI `DataGrid` so that its built-in strings (pagination,
 * column menu, filters, etc.) follow the user's browser locale, falling back to (US) English for any locale that
 * `@mui/x-data-grid` doesn't ship a translation for.
 */
export function useDataGridLocaleText(): Partial<GridLocaleText> {
  const intl = useIntl();
  const [localeText, setLocaleText] = useState<Partial<GridLocaleText>>(getDefaultDataGridLocaleText());

  useEffect(() => {
    let cancelled = false;

    intl.getLocale().then((locale) => {
      if (!cancelled) {
        setLocaleText(resolveDataGridLocaleText(locale));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [intl]);

  return localeText;
}

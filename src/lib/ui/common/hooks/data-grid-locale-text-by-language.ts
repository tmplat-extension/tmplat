import { GridLocaleText } from '@mui/x-data-grid';
import { enUS } from '@mui/x-data-grid/locales';

const asLocaleText = (localization: { components: { MuiDataGrid: { defaultProps: { localeText: unknown } } } }) =>
  localization.components.MuiDataGrid.defaultProps.localeText as Partial<GridLocaleText>;

/**
 * Maps a two-letter ISO 639-1 language code to the `@mui/x-data-grid` localisation closest matching it.
 *
 * `@mui/x-data-grid` only ships one variant per language (e.g. `zhCN` for `zh`), except for Chinese/Norwegian/
 * Portuguese, which are disambiguated by region below since a single BCP 47 language subtag isn't specific enough.
 */
const localeTextByLanguage: Readonly<Record<string, Partial<GridLocaleText>>> = {
  en: asLocaleText(enUS),
};

/** Languages disambiguated by region, keyed by the full lower-cased BCP 47 locale (e.g. `zh-cn`). */
const localeTextByRegion: Readonly<Record<string, Partial<GridLocaleText>>> = {
  // 'zh-cn': asLocaleText(zhCN),
  // 'zh-hk': asLocaleText(zhHK),
  // 'zh-tw': asLocaleText(zhTW),
};

export const getDefaultDataGridLocaleText = (): Partial<GridLocaleText> =>
  enUS.components.MuiDataGrid.defaultProps.localeText as Partial<GridLocaleText>;

export const resolveDataGridLocaleText = (locale: string): Partial<GridLocaleText> => {
  const normalized = locale.toLowerCase();

  return (
    localeTextByRegion[normalized] ??
    localeTextByLanguage[normalized.split(/[-_]/)[0]] ??
    getDefaultDataGridLocaleText()
  );
};

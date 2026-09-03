/**
 * Common props for each page rendered within the settings dialog, where each page owns a single slice of
 * {@link import('extension/common/settings/settings.model').Settings}.
 */
export type SettingsPageProps<T> = {
  onChange: (settings: T) => void;
  settings: Readonly<T>;
};

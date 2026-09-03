import { useIntl } from 'extension/common/intl/intl.context';
import { SettingsAnalytics } from 'extension/common/settings/settings.model';
import { SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
import { SettingsSection } from 'extension/ui/options/component/settings-section/settings-section';
import { SettingsSwitch } from 'extension/ui/options/component/settings-switch/settings-switch';

export function AnalyticsSettings({ onChange, settings }: SettingsPageProps<SettingsAnalytics>) {
  const intl = useIntl();

  return (
    <SettingsSection
      title={intl.getMessage('settings_analytics_title')}
      description={intl.getMessage('settings_analytics_description')}
    >
      <SettingsSwitch
        checked={settings.enabled}
        onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
        label={intl.getMessage('settings_analytics_enabled_label')}
        helperText={intl.getMessage('settings_analytics_enabled_helper_text')}
      />
    </SettingsSection>
  );
}

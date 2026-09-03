import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useIntl } from 'extension/common/intl/intl.context';
import { SettingsNotification } from 'extension/common/settings/settings.model';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
import { SettingsSection } from 'extension/ui/options/component/settings-section/settings-section';
import { SettingsSwitch } from 'extension/ui/options/component/settings-switch/settings-switch';

export function NotificationSettings({ onChange, settings }: SettingsPageProps<SettingsNotification>) {
  const intl = useIntl();

  const versionSegmentLabels: Readonly<Record<VersionSegment, string>> = {
    [VersionSegment.Major]: intl.getMessage('settings_notification_version_segment_major_label'),
    [VersionSegment.Minor]: intl.getMessage('settings_notification_version_segment_minor_label'),
    [VersionSegment.Patch]: intl.getMessage('settings_notification_version_segment_patch_label'),
  };

  return (
    <>
      <SettingsSection
        title={intl.getMessage('settings_notification_title')}
        description={intl.getMessage('settings_notification_description')}
      >
        <SettingsSwitch
          checked={settings.enabled}
          onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
          label={intl.getMessage('settings_notification_enabled_label')}
          helperText={intl.getMessage('settings_notification_enabled_helper_text')}
        />
      </SettingsSection>

      <SettingsSection
        title={intl.getMessage('settings_notification_change_log_title')}
        description={intl.getMessage('settings_notification_change_log_description')}
      >
        <SettingsSwitch
          checked={settings.changeLog.enabled}
          onChange={(event) =>
            onChange({
              ...settings,
              changeLog: { ...settings.changeLog, enabled: event.target.checked },
            })
          }
          label={intl.getMessage('settings_notification_change_log_enabled_label')}
        />
        <TextField
          select
          fullWidth
          label={intl.getMessage('settings_notification_change_log_scope_label')}
          value={settings.changeLog.scope}
          disabled={!settings.changeLog.enabled}
          onChange={(event) =>
            onChange({
              ...settings,
              changeLog: { ...settings.changeLog, scope: event.target.value as VersionSegment },
            })
          }
        >
          {Object.values(VersionSegment).map((scope) => (
            <MenuItem key={scope} value={scope}>
              {versionSegmentLabels[scope]}
            </MenuItem>
          ))}
        </TextField>
      </SettingsSection>
    </>
  );
}

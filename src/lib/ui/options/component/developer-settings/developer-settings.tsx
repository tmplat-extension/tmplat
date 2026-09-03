import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { getEnumNumberName, getEnumNumberValues } from 'extension/common/enum.utils';
import { useIntl } from 'extension/common/intl/intl.context';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { SettingsLogging } from 'extension/common/settings/settings.model';
import { SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
import { SettingsSection } from 'extension/ui/options/component/settings-section/settings-section';

const logLevels = [...getEnumNumberValues(LogLevel)].sort((a, b) => a - b);

export function DeveloperSettings({ onChange, settings }: SettingsPageProps<SettingsLogging>) {
  const intl = useIntl();

  return (
    <SettingsSection
      title={intl.getMessage('settings_developer_title')}
      description={intl.getMessage('settings_developer_description')}
    >
      <FormControlLabel
        control={
          <Switch
            checked={settings.enabled}
            onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
          />
        }
        label={intl.getMessage('settings_developer_enabled_label')}
      />
      <TextField
        select
        fullWidth
        label={intl.getMessage('settings_developer_level_label')}
        value={settings.level}
        disabled={!settings.enabled}
        helperText={intl.getMessage('settings_developer_level_helper_text')}
        onChange={(event) => onChange({ ...settings, level: Number(event.target.value) as LogLevel })}
      >
        {logLevels.map((level) => (
          <MenuItem key={level} value={level}>
            {getEnumNumberName(LogLevel, level)}
          </MenuItem>
        ))}
      </TextField>
    </SettingsSection>
  );
}

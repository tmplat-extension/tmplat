import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { useIntl } from 'extension/common/intl/intl.context';
import { SettingsAppearance } from 'extension/common/settings/settings.model';
import { SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
import { SettingsSection } from 'extension/ui/options/component/settings-section/settings-section';

export function AppearanceSettings({ onChange, settings }: SettingsPageProps<SettingsAppearance>) {
  const intl = useIntl();

  return (
    <SettingsSection
      title={intl.getMessage('settings_appearance_theme_title')}
      description={intl.getMessage('settings_appearance_theme_description')}
    >
      <FormControl>
        <RadioGroup
          value={settings.mode}
          onChange={(event) => onChange({ ...settings, mode: event.target.value as AppearanceMode })}
        >
          <FormControlLabel
            value={AppearanceMode.System}
            control={<Radio />}
            label={intl.getMessage('settings_appearance_theme_system_label')}
          />
          <FormControlLabel
            value={AppearanceMode.Light}
            control={<Radio />}
            label={intl.getMessage('settings_appearance_theme_light_label')}
          />
          <FormControlLabel
            value={AppearanceMode.Dark}
            control={<Radio />}
            label={intl.getMessage('settings_appearance_theme_dark_label')}
          />
        </RadioGroup>
      </FormControl>
    </SettingsSection>
  );
}

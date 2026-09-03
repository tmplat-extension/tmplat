import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import { useIntl } from 'extension/common/intl/intl.context';
import { type IntlService } from 'extension/common/intl/intl.service';
import { type SettingsUrlShortener } from 'extension/common/settings/settings.model';
import { isHttpUrl } from 'extension/common/url.utils';
import { type SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
import { SettingsSection } from 'extension/ui/options/component/settings-section/settings-section';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export function getUrlShortenerSettingsErrors(
  settings: Readonly<SettingsUrlShortener>,
  intl: IntlService,
): UrlShortenerSettingsYourlsErrors {
  const { yourls } = settings.providers;
  const errors: UrlShortenerSettingsYourlsErrors = {};

  // The URL is always validated, even when YOURLS is not the selected provider, as an invalid URL can never be persisted
  if (yourls.url?.trim() && !isHttpUrl(yourls.url.trim())) {
    errors.url = intl.getMessage('settings_shortener_error_url_invalid');
  }

  if (settings.provider !== UrlShortenerProviderName.Yourls) {
    return errors;
  }

  if (!yourls.url?.trim()) {
    errors.url = intl.getMessage('settings_shortener_error_url_required');
  }

  switch (yourls.authenticationMode) {
    case YourlsAuthenticationMode.Advanced:
      if (!yourls.signature?.trim()) {
        errors.signature = intl.getMessage('settings_shortener_error_signature_required');
      }
      break;
    case YourlsAuthenticationMode.Basic:
      if (!yourls.username?.trim()) {
        errors.username = intl.getMessage('settings_shortener_error_username_required');
      }
      if (!yourls.password?.trim()) {
        errors.password = intl.getMessage('settings_shortener_error_password_required');
      }
      break;
  }

  return errors;
}

export function isUrlShortenerSettingsValid(settings: Readonly<SettingsUrlShortener>, intl: IntlService): boolean {
  return Object.keys(getUrlShortenerSettingsErrors(settings, intl)).length === 0;
}

export function UrlShortenerSettings({ onChange, settings }: SettingsPageProps<UrlShortenerSettingsValue>) {
  const intl = useIntl();

  const { yourls } = settings.urlShortener.providers;
  const errors = getUrlShortenerSettingsErrors(settings.urlShortener, intl);

  const handleProviderChange = (providerName: string) =>
    onChange({
      ...settings,
      urlShortener: {
        ...settings.urlShortener,
        provider: providerName as UrlShortenerProviderName,
      },
    });

  const handleYourlsChange = (changes: Partial<typeof yourls>) =>
    onChange({
      ...settings,
      urlShortener: {
        ...settings.urlShortener,
        providers: {
          ...settings.urlShortener.providers,
          yourls: { ...yourls, ...changes },
        },
      },
    });

  return (
    <RadioGroup
      value={settings.urlShortener.provider}
      onChange={(event) => handleProviderChange(event.target.value)}
      aria-label={intl.getMessage('settings_shortener_group_label')}
    >
      <SettingsSection
        title={intl.getMessage('settings_shortener_spoome_title')}
        description={intl.getMessage('settings_shortener_spoome_description')}
        action={
          <Radio
            value={UrlShortenerProviderName.SpooMe}
            slotProps={{
              input: { 'aria-label': intl.getMessage('settings_shortener_spoome_radio_label') },
            }}
          />
        }
      />

      <SettingsSection
        title={intl.getMessage('settings_shortener_dagd_title')}
        description={intl.getMessage('settings_shortener_dagd_description')}
        action={
          <Radio
            value={UrlShortenerProviderName.DaGd}
            slotProps={{ input: { 'aria-label': intl.getMessage('settings_shortener_dagd_radio_label') } }}
          />
        }
      />

      <SettingsSection
        title={intl.getMessage('settings_shortener_yourls_title')}
        description={<>{intl.getMessage('settings_shortener_yourls_description')}</>}
        action={
          <Radio
            value={UrlShortenerProviderName.Yourls}
            slotProps={{
              input: { 'aria-label': intl.getMessage('settings_shortener_yourls_radio_label') },
            }}
          />
        }
      >
        <TextField
          fullWidth
          label={intl.getMessage('settings_shortener_yourls_url_field_label')}
          type="url"
          placeholder="https://example.com/yourls-api.php"
          value={yourls.url ?? ''}
          error={!!errors.url}
          helperText={errors.url ?? intl.getMessage('settings_shortener_yourls_url_field_helper_text')}
          onChange={(event) => handleYourlsChange({ url: event.target.value })}
        />
        <TextField
          select
          fullWidth
          label={intl.getMessage('settings_shortener_yourls_auth_field_label')}
          value={yourls.authenticationMode ?? ''}
          onChange={(event) =>
            handleYourlsChange({
              authenticationMode: (event.target.value || null) as YourlsAuthenticationMode | null,
            })
          }
        >
          <MenuItem value="">{intl.getMessage('settings_shortener_yourls_auth_none_option')}</MenuItem>
          <MenuItem value={YourlsAuthenticationMode.Basic}>
            {intl.getMessage('settings_shortener_yourls_auth_basic_option')}
          </MenuItem>
          <MenuItem value={YourlsAuthenticationMode.Advanced}>
            {intl.getMessage('settings_shortener_yourls_auth_advanced_option')}
          </MenuItem>
        </TextField>
        {yourls.authenticationMode === YourlsAuthenticationMode.Advanced && (
          <TextField
            fullWidth
            label={intl.getMessage('settings_shortener_yourls_signature_field_label')}
            type="password"
            autoComplete="off"
            value={yourls.signature ?? ''}
            error={!!errors.signature}
            helperText={errors.signature ?? intl.getMessage('settings_shortener_yourls_signature_field_helper_text')}
            onChange={(event) => handleYourlsChange({ signature: event.target.value })}
          />
        )}
        {yourls.authenticationMode === YourlsAuthenticationMode.Basic && (
          <>
            <TextField
              fullWidth
              label={intl.getMessage('settings_shortener_yourls_username_field_label')}
              autoComplete="off"
              value={yourls.username ?? ''}
              error={!!errors.username}
              helperText={errors.username}
              onChange={(event) => handleYourlsChange({ username: event.target.value })}
            />
            <TextField
              fullWidth
              label={intl.getMessage('settings_shortener_yourls_password_field_label')}
              type="password"
              autoComplete="off"
              value={yourls.password ?? ''}
              error={!!errors.password}
              helperText={errors.password ?? intl.getMessage('settings_shortener_yourls_password_field_helper_text')}
              onChange={(event) => handleYourlsChange({ password: event.target.value })}
            />
          </>
        )}
      </SettingsSection>
    </RadioGroup>
  );
}

export type UrlShortenerSettingsValue = {
  urlShortener: SettingsUrlShortener;
};

export type UrlShortenerSettingsYourlsErrors = {
  password?: string;
  signature?: string;
  url?: string;
  username?: string;
};

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { IntlService } from 'extension/common/intl/intl.service';
import { SettingsOAuth, SettingsUrlShortener } from 'extension/common/settings/settings.model';
import { isHttpUrl } from 'extension/common/url.utils';
import { useOAuth } from 'extension/oauth/oauth.context';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
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
    errors.url = intl.getMessage('settings_url_shortener_error_url_invalid');
  }

  if (settings.provider !== UrlShortenerProviderName.Yourls) {
    return errors;
  }

  if (!yourls.url?.trim()) {
    errors.url = intl.getMessage('settings_url_shortener_error_url_required');
  }

  switch (yourls.authenticationMode) {
    case YourlsAuthenticationMode.Advanced:
      if (!yourls.signature?.trim()) {
        errors.signature = intl.getMessage('settings_url_shortener_error_signature_required');
      }
      break;
    case YourlsAuthenticationMode.Basic:
      if (!yourls.username?.trim()) {
        errors.username = intl.getMessage('settings_url_shortener_error_username_required');
      }
      if (!yourls.password?.trim()) {
        errors.password = intl.getMessage('settings_url_shortener_error_password_required');
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
  const oauthService = useOAuth();
  const [authenticating, setAuthenticating] = useState(false);
  const [authenticationError, setAuthenticationError] = useState<string>();

  const { yourls } = settings.urlShortener.providers;
  const bitlyAccount = settings.oauth.providers[OAuthProviderName.Bitly];
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

  const handleBitlyAccountChange = useCallback(
    (accessToken: string | null, principal: string | null) =>
      onChange({
        ...settings,
        oauth: {
          ...settings.oauth,
          providers: {
            ...settings.oauth.providers,
            [OAuthProviderName.Bitly]: { accessToken, principal },
          },
        },
      }),
    [onChange, settings],
  );

  // The authentication flow itself cannot be deferred, however, the resulting tokens are only persisted once the user
  // saves their settings, just like every other field on this page
  const handleConnect = useCallback(async () => {
    setAuthenticating(true);
    setAuthenticationError(undefined);

    try {
      const { accessToken, principal } = await oauthService.requestAuthentication(OAuthProviderName.Bitly);
      handleBitlyAccountChange(accessToken, principal);
    } catch (e) {
      setAuthenticationError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthenticating(false);
    }
  }, [handleBitlyAccountChange, oauthService]);

  const handleDisconnect = useCallback(() => {
    setAuthenticationError(undefined);
    handleBitlyAccountChange(null, null);
  }, [handleBitlyAccountChange]);

  return (
    <RadioGroup
      value={settings.urlShortener.provider}
      onChange={(event) => handleProviderChange(event.target.value)}
      aria-label={intl.getMessage('settings_url_shortener_group_label')}
    >
      <SettingsSection
        title={intl.getMessage('settings_url_shortener_bitly_title')}
        description={intl.getMessage('settings_url_shortener_bitly_description')}
        action={
          <Radio
            value={UrlShortenerProviderName.Bitly}
            slotProps={{ input: { 'aria-label': intl.getMessage('settings_url_shortener_bitly_radio_label') } }}
          />
        }
      >
        {authenticationError && (
          <Alert severity="error" onClose={() => setAuthenticationError(undefined)}>
            {authenticationError}
          </Alert>
        )}
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            loading={authenticating}
            onClick={bitlyAccount.accessToken ? handleDisconnect : handleConnect}
          >
            {bitlyAccount.accessToken
              ? intl.getMessage('settings_url_shortener_bitly_disconnect_button')
              : intl.getMessage('settings_url_shortener_bitly_connect_button')}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {bitlyAccount.accessToken
              ? intl.getMessage(
                  'settings_url_shortener_bitly_connected_label',
                  bitlyAccount.principal ?? intl.getMessage('settings_url_shortener_bitly_connected_unknown_account'),
                )
              : intl.getMessage('settings_url_shortener_bitly_not_connected_label')}
          </Typography>
        </Box>
      </SettingsSection>

      <SettingsSection
        title={intl.getMessage('settings_url_shortener_spoome_title')}
        description={intl.getMessage('settings_url_shortener_spoome_description')}
        action={
          <Radio
            value={UrlShortenerProviderName.SpooMe}
            slotProps={{
              input: { 'aria-label': intl.getMessage('settings_url_shortener_spoome_radio_label') },
            }}
          />
        }
      />

      <SettingsSection
        title={intl.getMessage('settings_url_shortener_dagd_title')}
        description={intl.getMessage('settings_url_shortener_dagd_description')}
        action={
          <Radio
            value={UrlShortenerProviderName.DaGd}
            slotProps={{ input: { 'aria-label': intl.getMessage('settings_url_shortener_dagd_radio_label') } }}
          />
        }
      />

      <SettingsSection
        title={intl.getMessage('settings_url_shortener_yourls_title')}
        description={<>{intl.getMessage('settings_url_shortener_yourls_description')}</>}
        action={
          <Radio
            value={UrlShortenerProviderName.Yourls}
            slotProps={{
              input: { 'aria-label': intl.getMessage('settings_url_shortener_yourls_radio_label') },
            }}
          />
        }
      >
        <TextField
          fullWidth
          label={intl.getMessage('settings_url_shortener_yourls_url_field_label')}
          type="url"
          placeholder="https://example.com/yourls-api.php"
          value={yourls.url ?? ''}
          error={!!errors.url}
          helperText={errors.url ?? intl.getMessage('settings_url_shortener_yourls_url_field_helper_text')}
          onChange={(event) => handleYourlsChange({ url: event.target.value })}
        />
        <TextField
          select
          fullWidth
          label={intl.getMessage('settings_url_shortener_yourls_auth_field_label')}
          value={yourls.authenticationMode ?? ''}
          onChange={(event) =>
            handleYourlsChange({
              authenticationMode: (event.target.value || null) as YourlsAuthenticationMode | null,
            })
          }
        >
          <MenuItem value="">{intl.getMessage('settings_url_shortener_yourls_auth_none_option')}</MenuItem>
          <MenuItem value={YourlsAuthenticationMode.Basic}>
            {intl.getMessage('settings_url_shortener_yourls_auth_basic_option')}
          </MenuItem>
          <MenuItem value={YourlsAuthenticationMode.Advanced}>
            {intl.getMessage('settings_url_shortener_yourls_auth_advanced_option')}
          </MenuItem>
        </TextField>
        {yourls.authenticationMode === YourlsAuthenticationMode.Advanced && (
          <TextField
            fullWidth
            label={intl.getMessage('settings_url_shortener_yourls_signature_field_label')}
            type="password"
            autoComplete="off"
            value={yourls.signature ?? ''}
            error={!!errors.signature}
            helperText={
              errors.signature ?? intl.getMessage('settings_url_shortener_yourls_signature_field_helper_text')
            }
            onChange={(event) => handleYourlsChange({ signature: event.target.value })}
          />
        )}
        {yourls.authenticationMode === YourlsAuthenticationMode.Basic && (
          <>
            <TextField
              fullWidth
              label={intl.getMessage('settings_url_shortener_yourls_username_field_label')}
              autoComplete="off"
              value={yourls.username ?? ''}
              error={!!errors.username}
              helperText={errors.username}
              onChange={(event) => handleYourlsChange({ username: event.target.value })}
            />
            <TextField
              fullWidth
              label={intl.getMessage('settings_url_shortener_yourls_password_field_label')}
              type="password"
              autoComplete="off"
              value={yourls.password ?? ''}
              error={!!errors.password}
              helperText={
                errors.password ?? intl.getMessage('settings_url_shortener_yourls_password_field_helper_text')
              }
              onChange={(event) => handleYourlsChange({ password: event.target.value })}
            />
          </>
        )}
      </SettingsSection>
    </RadioGroup>
  );
}

/**
 * The URL shortener page also owns the OAuth accounts used by the providers it configures.
 */
export type UrlShortenerSettingsValue = {
  oauth: SettingsOAuth;
  urlShortener: SettingsUrlShortener;
};

export type UrlShortenerSettingsYourlsErrors = {
  password?: string;
  signature?: string;
  url?: string;
  username?: string;
};

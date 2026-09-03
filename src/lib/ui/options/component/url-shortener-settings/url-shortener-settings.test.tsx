import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { type Settings } from 'extension/common/settings/settings.model';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { renderUi } from 'extension/test/ui';
import { SettingsDialog } from 'extension/ui/options/component/settings-dialog/settings-dialog';
import {
  getUrlShortenerSettingsErrors,
  isUrlShortenerSettingsValid,
  UrlShortenerSettings,
  type UrlShortenerSettingsValue,
} from 'extension/ui/options/component/url-shortener-settings/url-shortener-settings';
import { createSettings } from 'extension/ui/options/test-fixtures';
import { UrlShortenerDataSchema } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

const createUrlShortenerSettings = (overrides: Partial<UrlShortenerSettingsValue> = {}): UrlShortenerSettingsValue => ({
  urlShortener: createSettings().urlShortener,
  ...overrides,
});

const createYourlsSettings = (
  overrides: Partial<UrlShortenerSettingsValue['urlShortener']['providers']['yourls']> = {},
): UrlShortenerSettingsValue =>
  createUrlShortenerSettings({
    urlShortener: {
      ...createSettings().urlShortener,
      provider: UrlShortenerProviderName.Yourls,
      providers: {
        ...createSettings().urlShortener.providers,
        [UrlShortenerProviderName.Yourls]: {
          authenticationMode: null,
          password: null,
          signature: null,
          url: 'https://sho.rt/yourls-api.php',
          username: null,
          ...overrides,
        },
      },
    },
  });

const setup = ({ settings = createUrlShortenerSettings() }: { settings?: UrlShortenerSettingsValue } = {}) => {
  const onChange = vi.fn<(settings: UrlShortenerSettingsValue) => void>();

  function Harness() {
    const [value, setValue] = useState(settings);

    return (
      <UrlShortenerSettings
        settings={value}
        onChange={(nextSettings) => {
          onChange(structuredClone(nextSettings));
          setValue(nextSettings);
        }}
      />
    );
  }

  renderUi(<Harness />);

  return { onChange, user: userEvent.setup() };
};

const setupDialog = ({
  loadFails = false,
  saveFails = false,
  settings = createSettings(),
}: {
  loadFails?: boolean;
  saveFails?: boolean;
  settings?: Settings;
} = {}) => {
  const settingsService = {
    getSettings: vi.fn(async () => structuredClone(settings)),
    saveSettings: vi.fn(async () => undefined),
  };

  if (loadFails) {
    settingsService.getSettings.mockRejectedValueOnce(new Error('load failed'));
  }
  if (saveFails) {
    settingsService.saveSettings.mockRejectedValueOnce(new Error('save failed'));
  }
  renderUi(<SettingsDialog open onClose={vi.fn()} />, { contexts: { settingsService } });

  return { settingsService, user: userEvent.setup() };
};

const lastButton = (name: string) => screen.getAllByRole('button', { name }).at(-1)!;

const openUrlShortenerPage = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText('settings_general_toolbar_button_title');
  await user.click(lastButton('settings_dialog_page_url_shorteners'));
  await screen.findByText('settings_shortener_spoome_title');
};

const selectProvider = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('radio', { name }));
};

const chooseYourlsAuthenticationMode = async (user: ReturnType<typeof userEvent.setup>, optionName: string) => {
  await user.click(screen.getByRole('combobox', { name: 'settings_shortener_yourls_auth_field_label' }));
  await user.click(await screen.findByRole('option', { name: optionName }));
};

const typeInField = async (user: ReturnType<typeof userEvent.setup>, name: string, value: string) => {
  const textbox = screen.getByRole('textbox', { name });

  await user.clear(textbox);
  await user.type(textbox, value);
};

const latestChange = (onChange: ReturnType<typeof vi.fn>): UrlShortenerSettingsValue =>
  onChange.mock.calls.at(-1)![0] as UrlShortenerSettingsValue;

describe('UrlShortenerSettings', () => {
  describe('provider selection', () => {
    it('renders persisted provider and YOURLS fields', () => {
      setup({
        settings: createYourlsSettings({
          authenticationMode: YourlsAuthenticationMode.Advanced,
          signature: 'secret-signature',
          url: 'https://sho.rt/yourls-api.php',
        }),
      });

      expect(screen.getByRole('radio', { name: 'settings_shortener_yourls_radio_label' })).toBeChecked();
      expect(screen.getByRole('textbox', { name: 'settings_shortener_yourls_url_field_label' })).toHaveValue(
        'https://sho.rt/yourls-api.php',
      );
      expect(screen.getByLabelText('settings_shortener_yourls_signature_field_label')).toHaveValue('secret-signature');
      expect(screen.queryByLabelText('settings_shortener_yourls_username_field_label')).not.toBeInTheDocument();
    });

    it.each([
      ['spoo.me', 'settings_shortener_spoome_radio_label', UrlShortenerProviderName.SpooMe],
      ['da.gd', 'settings_shortener_dagd_radio_label', UrlShortenerProviderName.DaGd],
      ['YOURLS', 'settings_shortener_yourls_radio_label', UrlShortenerProviderName.Yourls],
    ])('persists %s as the selected provider', async (_provider, label, provider) => {
      const { onChange, user } = setup({
        settings: createUrlShortenerSettings({
          urlShortener: {
            ...createSettings().urlShortener,
            provider:
              provider === UrlShortenerProviderName.DaGd
                ? UrlShortenerProviderName.SpooMe
                : UrlShortenerProviderName.DaGd,
          },
        }),
      });

      await selectProvider(user, label);

      expect(latestChange(onChange).urlShortener).toEqual({
        ...createSettings().urlShortener,
        provider,
      });
    });
  });

  describe('YOURLS fields', () => {
    it('writes the URL field without changing sibling provider config', async () => {
      const { onChange, user } = setup({ settings: createYourlsSettings() });

      await typeInField(user, 'settings_shortener_yourls_url_field_label', 'https://new.example/yourls-api.php');

      expect(latestChange(onChange).urlShortener.providers[UrlShortenerProviderName.Yourls]).toEqual({
        authenticationMode: null,
        password: null,
        signature: null,
        url: 'https://new.example/yourls-api.php',
        username: null,
      });
    });

    it('writes the advanced signature field', async () => {
      const { onChange, user } = setup({
        settings: createYourlsSettings({ authenticationMode: YourlsAuthenticationMode.Advanced, signature: null }),
      });

      await user.type(screen.getByLabelText('settings_shortener_yourls_signature_field_label'), 'abc123');

      expect(latestChange(onChange).urlShortener.providers[UrlShortenerProviderName.Yourls]).toEqual({
        authenticationMode: YourlsAuthenticationMode.Advanced,
        password: null,
        signature: 'abc123',
        url: 'https://sho.rt/yourls-api.php',
        username: null,
      });
    });

    it('writes basic username and password fields', async () => {
      const { onChange, user } = setup({
        settings: createYourlsSettings({
          authenticationMode: YourlsAuthenticationMode.Basic,
          password: null,
          username: null,
        }),
      });

      await typeInField(user, 'settings_shortener_yourls_username_field_label', 'yourls-user');
      await user.type(screen.getByLabelText('settings_shortener_yourls_password_field_label'), 'yourls-pass');

      expect(latestChange(onChange).urlShortener.providers[UrlShortenerProviderName.Yourls]).toEqual({
        authenticationMode: YourlsAuthenticationMode.Basic,
        password: 'yourls-pass',
        signature: null,
        url: 'https://sho.rt/yourls-api.php',
        username: 'yourls-user',
      });
    });

    it('switches between no, basic and advanced authentication modes', async () => {
      const { onChange, user } = setup({
        settings: createYourlsSettings({ authenticationMode: YourlsAuthenticationMode.Basic }),
      });

      expect(screen.getByLabelText('settings_shortener_yourls_username_field_label')).toBeInTheDocument();

      await chooseYourlsAuthenticationMode(user, 'settings_shortener_yourls_auth_advanced_option');

      expect(latestChange(onChange).urlShortener.providers[UrlShortenerProviderName.Yourls].authenticationMode).toBe(
        YourlsAuthenticationMode.Advanced,
      );
      expect(screen.getByLabelText('settings_shortener_yourls_signature_field_label')).toBeInTheDocument();
      expect(screen.queryByLabelText('settings_shortener_yourls_username_field_label')).not.toBeInTheDocument();

      await chooseYourlsAuthenticationMode(user, 'settings_shortener_yourls_auth_none_option');

      expect(
        latestChange(onChange).urlShortener.providers[UrlShortenerProviderName.Yourls].authenticationMode,
      ).toBeNull();
      expect(screen.queryByLabelText('settings_shortener_yourls_signature_field_label')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows required errors for the selected YOURLS provider', () => {
      setup({
        settings: createYourlsSettings({
          authenticationMode: YourlsAuthenticationMode.Basic,
          password: null,
          url: null,
          username: null,
        }),
      });

      expect(screen.getByText('settings_shortener_error_url_required')).toBeInTheDocument();
      expect(screen.getByText('settings_shortener_error_username_required')).toBeInTheDocument();
      expect(screen.getByText('settings_shortener_error_password_required')).toBeInTheDocument();
    });

    it('validates a configured YOURLS URL even when another provider is selected', () => {
      const intl = asIntlService(createIntlServiceMock());
      const settings = createUrlShortenerSettings({
        urlShortener: {
          ...createSettings().urlShortener,
          provider: UrlShortenerProviderName.SpooMe,
          providers: {
            ...createSettings().urlShortener.providers,
            [UrlShortenerProviderName.Yourls]: {
              authenticationMode: null,
              password: null,
              signature: null,
              url: 'ftp://example.com/yourls-api.php',
              username: null,
            },
          },
        },
      });

      expect(getUrlShortenerSettingsErrors(settings.urlShortener, intl)).toEqual({
        url: 'settings_shortener_error_url_invalid',
      });
      expect(isUrlShortenerSettingsValid(settings.urlShortener, intl)).toBe(false);
    });

    it('accepts a valid schema-shaped provider configuration', () => {
      const intl = asIntlService(createIntlServiceMock());
      const settings = createYourlsSettings({
        authenticationMode: YourlsAuthenticationMode.Advanced,
        password: null,
        signature: 'sha256-token',
        url: 'https://sho.rt/yourls-api.php',
        username: null,
      });

      expect(isUrlShortenerSettingsValid(settings.urlShortener, intl)).toBe(true);
      expect(UrlShortenerDataSchema.safeParse(settings.urlShortener).success).toBe(true);
    });
  });

  describe('settings dialog integration', () => {
    it('loads persisted URL shortener settings exactly once when the dialog opens', async () => {
      const { settingsService, user } = setupDialog({
        settings: createSettings({
          urlShortener: createYourlsSettings({
            authenticationMode: YourlsAuthenticationMode.Advanced,
            signature: 'loaded-signature',
            url: 'https://loaded.example/yourls-api.php',
          }).urlShortener,
        }),
      });

      await openUrlShortenerPage(user);

      expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('radio', { name: 'settings_shortener_yourls_radio_label' })).toBeChecked();
      expect(screen.getByRole('textbox', { name: 'settings_shortener_yourls_url_field_label' })).toHaveValue(
        'https://loaded.example/yourls-api.php',
      );
      expect(screen.getByLabelText('settings_shortener_yourls_signature_field_label')).toHaveValue('loaded-signature');
    });

    it('saves the edited URL shortener payload shape through SettingsService', async () => {
      const { settingsService, user } = setupDialog();
      await openUrlShortenerPage(user);

      await selectProvider(user, 'settings_shortener_yourls_radio_label');
      await typeInField(user, 'settings_shortener_yourls_url_field_label', 'https://save.example/yourls-api.php');
      await typeInField(user, 'settings_shortener_yourls_username_field_label', 'save-user');
      await user.type(screen.getByLabelText('settings_shortener_yourls_password_field_label'), 'save-pass');
      await user.click(screen.getByRole('button', { name: 'settings_dialog_apply_button' }));

      const expected = createSettings({
        urlShortener: {
          ...createSettings().urlShortener,
          provider: UrlShortenerProviderName.Yourls,
          providers: {
            ...createSettings().urlShortener.providers,
            [UrlShortenerProviderName.Yourls]: {
              authenticationMode: YourlsAuthenticationMode.Basic,
              password: 'save-pass',
              signature: null,
              url: 'https://save.example/yourls-api.php',
              username: 'save-user',
            },
          },
        },
      });

      await waitFor(() => expect(settingsService.saveSettings).toHaveBeenCalledExactlyOnceWith(expected));
    });

    it('reports load failures before the URL shortener page is available', async () => {
      setupDialog({ loadFails: true });

      expect(await screen.findByRole('alert')).toHaveTextContent('app_error_unknown_message');
      expect(screen.queryByText('settings_dialog_page_url_shorteners')).not.toBeInTheDocument();
    });

    it('reports save failures without swallowing the rejected save', async () => {
      const { settingsService, user } = setupDialog({ saveFails: true });
      await openUrlShortenerPage(user);

      await selectProvider(user, 'settings_shortener_spoome_radio_label');
      await user.click(screen.getByRole('button', { name: 'settings_dialog_apply_button' }));

      expect(settingsService.saveSettings).toHaveBeenCalledTimes(1);
      expect(await screen.findByRole('alert')).toHaveTextContent('app_error_unknown_message');
    });
  });
});

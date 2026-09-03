import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export type UrlShortenerData = {
  /**
   * The single provider currently used to shorten URLs; exactly one must always be selected, replacing the
   * previous per-provider `enabled` flags (which allowed an inconsistent none/multiple-enabled state).
   */
  provider: UrlShortenerProviderName;
  providers: UrlShortenerDataProviders;
};

export type UrlShortenerDataBitlyProvider = UrlShortenerDataProvider;

export type UrlShortenerDataDaGdProvider = UrlShortenerDataProvider;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type UrlShortenerDataProvider = {};

/**
 * Keyed by `UrlShortenerProviderName` value (not the enum member name) so that a provider's data can always be
 * looked up directly via `providers[provider]`, without a separate name-to-key mapping.
 */
export type UrlShortenerDataProviders = {
  [UrlShortenerProviderName.Bitly]: UrlShortenerDataBitlyProvider;
  [UrlShortenerProviderName.DaGd]: UrlShortenerDataDaGdProvider;
  [UrlShortenerProviderName.SpooMe]: UrlShortenerDataSpooMeProvider;
  [UrlShortenerProviderName.Yourls]: UrlShortenerDataYourlsProvider;
};

export type UrlShortenerDataSpooMeProvider = UrlShortenerDataProvider;

export type UrlShortenerDataYourlsProvider = UrlShortenerDataProvider & {
  authenticationMode: YourlsAuthenticationMode | null;
  password: string | null;
  signature: string | null;
  url: string | null;
  username: string | null;
};

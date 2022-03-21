import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export type UrlShortenerData = {
  providers: UrlShortenerDataProviders;
};

export type UrlShortenerDataBitlyProvider = UrlShortenerDataProvider;

export type UrlShortenerDataProvider = {
  enabled: boolean;
};

export type UrlShortenerDataProviders = {
  bitly: UrlShortenerDataBitlyProvider;
  yourls: UrlShortenerDataYourlsProvider;
};

export type UrlShortenerDataYourlsProvider = UrlShortenerDataProvider & {
  authenticationMode: YourlsAuthenticationMode | null;
  password: string | null;
  signature: string | null;
  url: string | null;
  username: string | null;
};

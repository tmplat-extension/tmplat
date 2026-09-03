import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';

export type OAuthData = {
  providers: Record<OAuthProviderName, OAuthDataProvider>;
};

export type OAuthDataProvider = {
  accessToken: string | null;
  principal: string | null;
};

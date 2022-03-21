import { isString } from 'lodash-es';

import { OAuthDataRepository } from 'extension/oauth/data/oauth-data.repository';
import { OAuthAuthentication } from 'extension/oauth/oauth.model';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';

export const OAuthProviderToken = Symbol('OAuthProvider');

export abstract class OAuthProvider {
  abstract readonly name: OAuthProviderName;
  protected abstract readonly repository: OAuthDataRepository;

  async authenticate(): Promise<OAuthAuthentication> {
    const existingAuthentication = await this.getAuthentication();
    if (existingAuthentication) {
      return existingAuthentication;
    }

    const details = this.getDetails();
    const authorizationCode = await this.getAuthorizationCode(details);
    const authentication = await this.getAuthenticationInternal(authorizationCode, details);

    await this.persist(authentication.accessToken, authentication.principal);

    return authentication;
  }

  protected abstract extractAuthentication(response: Response): Promise<OAuthAuthentication | null>;

  async getAuthentication(): Promise<OAuthAuthentication | null> {
    const data = await this.repository.get();
    const { accessToken, principal } = data.providers[this.name];

    if (accessToken == null) {
      return null;
    }

    return {
      accessToken,
      principal,
    };
  }

  protected abstract getDetails(): OAuthProviderDetails;

  protected getRedirectUri(): string {
    return chrome.identity.getRedirectURL();
  }

  async isAuthenticated(): Promise<boolean> {
    const data = await this.repository.get();
    return data.providers[this.name].accessToken != null;
  }

  async revokeAuthentication(): Promise<void> {
    await this.persist(null, null);
  }

  private createAuthenticationUrl({
    authenticationUrl,
    authenticationUrlParams,
    authenticationUrlRedirectUriParamName,
  }: OAuthProviderDetails): string {
    const url = new URL(authenticationUrl);
    url.searchParams.set(authenticationUrlRedirectUriParamName || 'redirect_uri', this.getRedirectUri());

    if (authenticationUrlParams) {
      OAuthProvider.appendParams(url, authenticationUrlParams);
    }

    return url.toString();
  }

  private async getAuthenticationInternal(
    authorizationCode: string,
    {
      accessTokenUrl,
      accessTokenUrlBodyProvider,
      accessTokenUrlHeadersProvider,
      accessTokenUrlMethodProvider,
      accessTokenUrlParamsProvider,
    }: OAuthProviderDetails,
  ): Promise<OAuthAuthentication> {
    const url = new URL(accessTokenUrl);
    const options: RequestInit = {
      body: accessTokenUrlBodyProvider ? accessTokenUrlBodyProvider(authorizationCode) : null,
      headers: accessTokenUrlHeadersProvider
        ? accessTokenUrlHeadersProvider(authorizationCode)
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
      method: accessTokenUrlMethodProvider ? accessTokenUrlMethodProvider(authorizationCode) : 'POST',
    };

    if (accessTokenUrlParamsProvider) {
      OAuthProvider.appendParams(url, accessTokenUrlParamsProvider(authorizationCode));
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`OAuth provider '${this.name}' could not authenticate due to error response`);
    }

    const authentication = await this.extractAuthentication(response);

    if (!authentication) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`OAuth provider '${this.name}' could not authenticate due to missing access token`);
    }

    return authentication;
  }

  private getAuthorizationCode(details: OAuthProviderDetails): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: this.createAuthenticationUrl(details), interactive: true },
        (redirectUri) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!redirectUri) {
            // TODO: Localise error message and use ExtensionError instead
            reject(new Error(`OAuth provider '${this.name}' could not authenticate due to missing redirect URI`));
            return;
          }

          const authorizationCode = OAuthProvider.extractAuthorizationCode(redirectUri, details);
          if (!authorizationCode) {
            // TODO: Localise error message and use ExtensionError instead
            reject(new Error(`OAuth provider '${this.name}' could not authenticate due to missing authorization code`));
            return;
          }

          resolve(authorizationCode);
        },
      );
    });
  }

  private async persist(accessToken: string | null, principal: string | null): Promise<void> {
    const data = await this.repository.get();
    const providerData = data.providers[this.name];
    providerData.accessToken = accessToken;
    providerData.principal = principal;

    await this.repository.set(data);
  }

  private static appendParams(url: URL, params: Readonly<Record<string, string | readonly string[]>>) {
    Object.entries(params).forEach(([name, value]) => {
      if (isString(value)) {
        url.searchParams.set(name, value);
      } else {
        value.forEach((singleValue) => url.searchParams.append(name, singleValue));
      }
    });
  }

  private static extractAuthorizationCode(
    redirectUri: string,
    { redirectUriAuthorizationCodeParamName }: OAuthProviderDetails,
  ): string | null {
    const url = new URL(redirectUri);
    return url.searchParams.get(redirectUriAuthorizationCodeParamName || 'code');
  }
}

export type OAuthProviderDetails = {
  readonly accessTokenUrl: string;
  readonly accessTokenUrlBodyProvider?: (authorizationCode: string) => BodyInit;
  readonly accessTokenUrlHeadersProvider?: (authorizationCode: string) => Readonly<Record<string, string>>;
  readonly accessTokenUrlMethodProvider?: (authorizationCode: string) => string;
  readonly accessTokenUrlParamsProvider?: (
    authorizationCode: string,
  ) => Readonly<Record<string, string | readonly string[]>>;
  readonly authenticationUrl: string;
  readonly authenticationUrlParams?: Readonly<Record<string, string | readonly string[]>>;
  readonly authenticationUrlRedirectUriParamName?: string;
  readonly redirectUriAuthorizationCodeParamName?: string;
};

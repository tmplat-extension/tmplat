import { injectable, multiInject } from 'extension/common/di';
import { type OAuthAuthentication } from 'extension/oauth/oauth.model';
import { type OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { type OAuthProvider, OAuthProviderToken } from 'extension/oauth/provider/oauth.provider';

export const OAuthServiceToken = Symbol('OAuthService');

@injectable()
export class OAuthService {
  constructor(@multiInject(OAuthProviderToken) private readonly providers: OAuthProvider[]) {}

  async authenticate(providerName: OAuthProviderName): Promise<OAuthAuthentication> {
    // TODO: Track analytics
    return this.getProvider(providerName).authenticate();
  }

  async getAuthentication(providerName: OAuthProviderName): Promise<OAuthAuthentication | null> {
    return this.getProvider(providerName).getAuthentication();
  }

  async isAuthenticated(providerName: OAuthProviderName): Promise<boolean> {
    return this.getProvider(providerName).isAuthenticated();
  }

  /**
   * Performs the authentication flow without persisting the result, allowing the caller to decide if and when it is
   * stored.
   */
  async requestAuthentication(providerName: OAuthProviderName): Promise<OAuthAuthentication> {
    // TODO: Track analytics
    return this.getProvider(providerName).requestAuthentication();
  }

  async revokeAuthentication(providerName: OAuthProviderName): Promise<void> {
    return this.getProvider(providerName).revokeAuthentication();
  }

  private getProvider(providerName: OAuthProviderName): OAuthProvider {
    const provider = this.providers.find((p) => p.name === providerName);
    if (!provider) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`OAuth provider '${providerName}' not found`);
    }

    return provider;
  }
}

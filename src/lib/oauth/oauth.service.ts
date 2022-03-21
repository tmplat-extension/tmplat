import { injectable, multiInject } from 'extension/common/di';
import { OAuthAuthentication } from 'extension/oauth/oauth.model';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { OAuthProvider, OAuthProviderToken } from 'extension/oauth/provider/oauth.provider';

export const OAuthServiceToken = Symbol('OAuthService');

@injectable()
export class OAuthService {
  constructor(@multiInject(OAuthProviderToken) private readonly providers: OAuthProvider[]) {}

  authenticate(providerName: OAuthProviderName): Promise<OAuthAuthentication> {
    // TODO: Track analytics
    return this.getProvider(providerName).authenticate();
  }

  getAuthentication(providerName: OAuthProviderName): Promise<OAuthAuthentication | null> {
    return this.getProvider(providerName).getAuthentication();
  }

  isAuthenticated(providerName: OAuthProviderName): Promise<boolean> {
    return this.getProvider(providerName).isAuthenticated();
  }

  revokeAuthentication(providerName: OAuthProviderName): Promise<void> {
    return this.getProvider(providerName).revokeAuthentication();
  }

  private getProvider(providerName: OAuthProviderName): OAuthProvider {
    const provider = this.providers.find((provider) => provider.name === providerName);
    if (!provider) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`OAuth provider '${providerName}' not found`);
    }

    return provider;
  }
}

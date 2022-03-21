import { isString } from 'lodash-es';

import { inject, injectable } from 'extension/common/di';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';
import { OAuthAuthentication } from 'extension/oauth/oauth.model';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { OAuthProvider, OAuthProviderDetails } from 'extension/oauth/provider/oauth.provider';

@injectable()
export class BitlyOAuthProvider extends OAuthProvider {
  readonly name = OAuthProviderName.Bitly;

  constructor(@inject(OAuthDataRepositoryToken) protected readonly repository: OAuthDataRepository) {
    super();
  }

  protected async extractAuthentication(response: Response): Promise<OAuthAuthentication | null> {
    const { access_token: accessToken, login } = await response.json();

    if (!isString(accessToken)) {
      return null;
    }

    return {
      accessToken,
      principal: isString(login) ? login : null,
    };
  }

  protected getDetails(): OAuthProviderDetails {
    const clientId = 'deb9b5c6c0c5928674a0601691e404b1de021f0f';
    const clientSecret = '9f0352d25dabc8bf4e087fccda40d6b2971e7ae7';

    return {
      accessTokenUrl: 'https://api-ssl.bitly.com/oauth/access_token',
      accessTokenUrlParamsProvider: (authorizationCode) => ({
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.getRedirectUri(),
      }),
      authenticationUrl: 'https://bitly.com/oauth/authorize',
      authenticationUrlParams: {
        client_id: clientId,
      },
    };
  }
}

import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { OAuthData, OAuthDataProvider } from 'extension/oauth/data/oauth-data.model';
import { oauthDataSchema } from 'extension/oauth/data/oauth-data.schema';

export const OAuthDataRepositoryToken = Symbol('OAuthDataRepository');

@injectable()
export class OAuthDataRepository extends DataRepository<OAuthData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.OAuth, oauthDataSchema, dataService.sync);
  }

  install(): Promise<void> {
    return this.set({
      providers: {
        bitly: OAuthDataRepository.createEmptyOAuthDataProvider(),
      },
    });
  }

  isInstalled(): Promise<boolean> {
    return this.isNotEmpty();
  }

  private static createEmptyOAuthDataProvider(): OAuthDataProvider {
    return {
      accessToken: null,
      principal: null,
    };
  }
}

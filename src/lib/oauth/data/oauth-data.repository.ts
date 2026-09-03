import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { OAuthData } from 'extension/oauth/data/oauth-data.model';
import { oauthDataSchema } from 'extension/oauth/data/oauth-data.schema';

export const OAuthDataRepositoryToken = Symbol('OAuthDataRepository');

@injectable()
export class OAuthDataRepository extends RequiredDataRepository<OAuthData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    // Access tokens are credentials, so this deliberately uses local (device-only) storage rather than sync
    super(DataNamespace.OAuth, oauthDataSchema, dataService.local);
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      providers: {
        bitly: {
          accessToken: null,
          principal: null,
        },
      },
    }));
  }
}

import { isPlainObject, isString } from 'lodash-es';

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { DataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { OAuthData } from 'extension/oauth/data/oauth-data.model';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';

@injectable()
export class OAuthDataMigrator implements DataMigrator {
  readonly namespace = DataNamespace.OAuth;

  constructor(@inject(OAuthDataRepositoryToken) private readonly repository: OAuthDataRepository) {}

  isRequired(oldVersion: ExtensionVersion): boolean {
    return oldVersion === ExtensionVersion.V1_2_9;
  }

  async migrate({ legacyDataService, oldVersion }: DataMigrationContext): Promise<void> {
    if (oldVersion === ExtensionVersion.V1_2_9) {
      const legacyBitlyOAuthData = await legacyDataService.local.get('oauth2_bitly');

      await this.repository.modify((data) => {
        OAuthDataMigrator.migrateBitly(data, legacyBitlyOAuthData);

        return data;
      });

      await legacyDataService.local.removeAll(['oauth2_adapterReverse', 'oauth2_bitly', 'oauth2_google']);
    }
  }

  private static migrateBitly(data: OAuthData, legacyBitlyOAuthData: any) {
    if (!isPlainObject(legacyBitlyOAuthData)) {
      return;
    }

    if (isString(legacyBitlyOAuthData.accessToken)) {
      data.providers.bitly.accessToken = legacyBitlyOAuthData.accessToken || null;
    }
    if (isString(legacyBitlyOAuthData.login)) {
      data.providers.bitly.principal = data.providers.bitly.accessToken ? legacyBitlyOAuthData.login || null : null;
    }
  }
}

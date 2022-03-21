import { isBoolean, isPlainObject, isString } from 'lodash-es';

import { encodeBase64 } from 'extension/common/codec/base64.utils';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { DataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { isEnumStringValue } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.model';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

@injectable()
export class UrlShortenerDataMigrator implements DataMigrator {
  readonly namespace = DataNamespace.UrlShortener;

  constructor(@inject(UrlShortenerDataRepositoryToken) private readonly repository: UrlShortenerDataRepository) {}

  isRequired(oldVersion: ExtensionVersion): boolean {
    return oldVersion === ExtensionVersion.V1_2_9;
  }

  async migrate({ legacyDataService, oldVersion }: DataMigrationContext): Promise<void> {
    if (oldVersion === ExtensionVersion.V1_2_9) {
      const legacyBitlyData = await legacyDataService.local.get('bitly');
      const legacyYourlsData = await legacyDataService.local.get('yourls');

      await this.repository.modify((data) => {
        UrlShortenerDataMigrator.migrateBitly(data, legacyBitlyData);
        UrlShortenerDataMigrator.migrateYourls(data, legacyYourlsData);

        UrlShortenerDataMigrator.ensureSingleProviderEnabled(data);

        return data;
      });

      await legacyDataService.local.removeAll(['bitly', 'googl', 'yourls']);
    }
  }

  private static ensureSingleProviderEnabled(data: UrlShortenerData) {
    const enabledProviders = Object.values(data.providers).filter((provider) => provider.enabled);

    switch (enabledProviders.length) {
      case 0:
        data.providers.bitly.enabled = true;
        break;
      case 1:
        // Do nothing
        break;
      default:
        enabledProviders.forEach((provider, index) => {
          provider.enabled = index === 0;
        });
        break;
    }
  }

  private static migrateBitly(data: UrlShortenerData, legacyBitlyData: any) {
    if (isPlainObject(legacyBitlyData) && isBoolean(legacyBitlyData.enabled)) {
      data.providers.bitly = legacyBitlyData.enabled;
    }
  }

  private static migrateYourls(data: UrlShortenerData, legacyYourlsData: any) {
    if (!isPlainObject(legacyYourlsData)) {
      return;
    }

    if (isEnumStringValue(YourlsAuthenticationMode, legacyYourlsData.authentication)) {
      data.providers.yourls.authenticationMode = legacyYourlsData.authentication;
    }
    if (isBoolean(legacyYourlsData.enabled)) {
      data.providers.yourls.enabled = legacyYourlsData.enabled;
    }
    if (isString(legacyYourlsData.password)) {
      data.providers.yourls.password = encodeBase64(legacyYourlsData.password) || null;
    }
    if (isString(legacyYourlsData.signature)) {
      data.providers.yourls.signature = encodeBase64(legacyYourlsData.signature) || null;
    }
    if (isString(legacyYourlsData.url)) {
      data.providers.yourls.url = legacyYourlsData.url || null;
    }
    if (isString(legacyYourlsData.username)) {
      data.providers.yourls.username = encodeBase64(legacyYourlsData.username) || null;
    }
  }
}

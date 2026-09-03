import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { LegacyUrlShortenerYourlsProviderDataSchema } from 'extension/url-shortener/data/legacy-url-shortener-data.schema';
import {
  type UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

@injectable()
export class UrlShortenerDataMigrator extends AbstractDataMigrator {
  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(UrlShortenerDataRepositoryToken) private readonly repository: UrlShortenerDataRepository,
  ) {
    super({
      intl,
      logger: logging.getLogger('UrlShortenerDataMigrator'),
      namespace: DataNamespace.UrlShortener,
    });
  }

  protected getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return [
      // Bitly support was dropped in 2.0.0, so its options are deleted rather than carried over
      builder.createSimpleStepForRemoval('1.2.9', 'migrate_namespace_url_shortener_migration_step_1', {
        keys: ['bitly'],
        storage: 'local',
      }),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'migrate_namespace_url_shortener_migration_step_2',
        { key: 'yourls', schema: LegacyUrlShortenerYourlsProviderDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.authentication !== undefined) {
            data.providers.yourls.authenticationMode = legacyData.authentication;
          }
          if (legacyData.password !== undefined) {
            data.providers.yourls.password = legacyData.password;
          }
          if (legacyData.signature !== undefined) {
            data.providers.yourls.signature = legacyData.signature;
          }
          if (legacyData.url !== undefined) {
            data.providers.yourls.url = legacyData.url;
          }
          if (legacyData.username !== undefined) {
            data.providers.yourls.username = legacyData.username;
          }
          if (legacyData.enabled) {
            data.provider = UrlShortenerProviderName.Yourls;
          }
        },
      ),
      // goo.gl no longer exists so support has been dropped
      builder.createSimpleStepForRemoval('1.2.9', 'migrate_namespace_url_shortener_migration_step_3', {
        keys: ['googl'],
        storage: 'local',
      }),
      /*
       * These are the legacy OAuth keys. Bitly was the only OAuth provider, so dropping Bitly in 2.0.0 removed the
       * OAuth mechanism altogether and this namespace inherited the cleanup. `oauth2_bitly` holds an access token,
       * so deleting it is what stops a credential the extension can no longer use from sitting in local storage
       * indefinitely.
       */
      builder.createSimpleStepForRemoval('1.2.9', 'migrate_namespace_url_shortener_migration_step_4', {
        keys: ['oauth2_bitly', 'oauth2_adapterReverse', 'oauth2_google'],
        storage: 'local',
      }),
    ];
  }
}

import { isBoolean, isPlainObject, isString } from 'es-toolkit';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { isEnumStringValue } from 'extension/common/enum.utils';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  type UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

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
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_url_shortener_migration_step_1',
        'bitly',
        this.repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData) && isBoolean(legacyData.enabled) && legacyData.enabled) {
            data.provider = UrlShortenerProviderName.Bitly;
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_url_shortener_migration_step_2',
        'yourls',
        this.repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData)) {
            if (isEnumStringValue(YourlsAuthenticationMode, legacyData.authentication)) {
              data.providers.yourls.authenticationMode = legacyData.authentication;
            }
            if (isBoolean(legacyData.enabled) && legacyData.enabled) {
              data.provider = UrlShortenerProviderName.Yourls;
            }
            if (isString(legacyData.password)) {
              data.providers.yourls.password = legacyData.password || null;
            }
            if (isString(legacyData.signature)) {
              data.providers.yourls.signature = legacyData.signature || null;
            }
            if (isString(legacyData.url)) {
              data.providers.yourls.url = legacyData.url || null;
            }
            if (isString(legacyData.username)) {
              data.providers.yourls.username = legacyData.username || null;
            }
          }
        },
      ),
      builder.createSimpleStepForRemoval('1.2.9', 'data_namespace_url_shortener_migration_step_3', ['googl']),
    ];
  }
}

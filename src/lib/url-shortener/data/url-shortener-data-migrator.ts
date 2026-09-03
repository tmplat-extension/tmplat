import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { isEnumStringValue } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { isBoolean, isPlainObject, isString } from 'extension/common/type.utils';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

@injectable()
export class UrlShortenerDataMigrator extends AbstractDataMigrator {
  protected readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(UrlShortenerDataRepositoryToken) repository: UrlShortenerDataRepository,
  ) {
    super(DataNamespace.UrlShortener, 'data_namespace_url_shortener', intl, [
      AbstractDataMigrator.createSimpleStepForTransfer(
        ExtensionVersion.V1_2_9,
        'data_namespace_url_shortener_migration_step_1',
        'bitly',
        repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData) && isBoolean(legacyData.enabled) && legacyData.enabled) {
            data.provider = UrlShortenerProviderName.Bitly;
          }
        },
      ),
      AbstractDataMigrator.createSimpleStepForTransfer(
        ExtensionVersion.V1_2_9,
        'data_namespace_url_shortener_migration_step_2',
        'yourls',
        repository,
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
      AbstractDataMigrator.createSimpleStepForRemoval(
        ExtensionVersion.V1_2_9,
        'data_namespace_url_shortener_migration_step_3',
        ['googl'],
      ),
    ]);

    this.logger = loggingService.createLogger('UrlShortenerDataMigrator');
  }
}

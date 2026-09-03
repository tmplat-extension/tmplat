import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { isPlainObject, isString } from 'extension/common/type.utils';
import { OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';

@injectable()
export class OAuthDataMigrator extends AbstractDataMigrator {
  protected readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(OAuthDataRepositoryToken) repository: OAuthDataRepository,
  ) {
    super(DataNamespace.OAuth, 'data_namespace_oauth', intl, [
      AbstractDataMigrator.createSimpleStepForTransfer(
        ExtensionVersion.V1_2_9,
        'data_namespace_oauth_migration_step_1',
        'oauth2_bitly',
        repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData)) {
            if (isString(legacyData.accessToken)) {
              data.providers.bitly.accessToken = legacyData.accessToken || null;
            }
            if (isString(legacyData.login)) {
              data.providers.bitly.principal = data.providers.bitly.accessToken ? legacyData.login || null : null;
            }
          }
        },
      ),
      AbstractDataMigrator.createSimpleStepForRemoval(
        ExtensionVersion.V1_2_9,
        'data_namespace_oauth_migration_step_2',
        ['oauth2_adapterReverse', 'oauth2_google'],
      ),
    ]);

    this.logger = loggingService.createLogger('OAuthDataMigrator');
  }
}

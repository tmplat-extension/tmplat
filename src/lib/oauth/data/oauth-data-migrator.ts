import { isPlainObject, isString } from 'es-toolkit';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type OAuthDataRepository, OAuthDataRepositoryToken } from 'extension/oauth/data/oauth-data.repository';

@injectable()
export class OAuthDataMigrator extends AbstractDataMigrator {
  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(OAuthDataRepositoryToken) private readonly repository: OAuthDataRepository,
  ) {
    super({
      intl,
      logger: logging.getLogger('OAuthDataMigrator'),
      namespace: DataNamespace.OAuth,
    });
  }

  protected getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return [
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_oauth_migration_step_1',
        'oauth2_bitly',
        this.repository,
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
      builder.createSimpleStepForRemoval('1.2.9', 'data_namespace_oauth_migration_step_2', [
        'oauth2_adapterReverse',
        'oauth2_google',
      ]),
    ];
  }
}

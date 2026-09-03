import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { LegacyOAuthProviderDataSchema } from 'extension/oauth/data/legacy-oauth-data.schema';
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
        { key: 'oauth2_bitly', schema: LegacyOAuthProviderDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.accessToken !== undefined) {
            data.providers.bitly.accessToken = legacyData.accessToken;
          }
          if (legacyData.login !== undefined) {
            data.providers.bitly.principal = legacyData.login;
          }
        },
      ),
      builder.createSimpleStepForRemoval('1.2.9', 'data_namespace_oauth_migration_step_2', {
        keys: ['oauth2_adapterReverse', 'oauth2_google'],
        storage: 'local',
      }),
    ];
  }
}

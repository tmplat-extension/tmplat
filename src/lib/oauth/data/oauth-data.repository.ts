import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { type OAuthData, OAuthDataSchema } from 'extension/oauth/data/oauth-data.schema';

const OAuthDataRepositoryName = 'OAuthDataRepository';

export const OAuthDataRepositoryToken = Symbol(OAuthDataRepositoryName);

@injectable()
export class OAuthDataRepository
  extends RequiredDataRepository<typeof OAuthDataSchema, OAuthData>
  implements DataInstaller
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    // Access tokens are credentials, so this deliberately uses local (device-only) storage rather than sync
    super({
      dataStorage: dataService.local,
      logger: logging.getLogger(OAuthDataRepositoryName),
      namespace: DataNamespace.OAuth,
      schema: OAuthDataSchema,
      validationService,
    });
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

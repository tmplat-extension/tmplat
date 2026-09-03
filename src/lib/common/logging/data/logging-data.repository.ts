import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingData, LoggingDataSchema } from 'extension/common/logging/data/logging-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';

export const LoggingDataRepositoryToken = Symbol('LoggingDataRepository');

@injectable()
export class LoggingDataRepository
  extends RequiredDataRepository<typeof LoggingDataSchema, LoggingData>
  implements DataInstaller
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    super({
      dataStorage: dataService.sync,
      namespace: DataNamespace.Logging,
      schema: LoggingDataSchema,
      validationService,
    });
  }

  install({ extensionInfo }: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      enabled: true,
      level: extensionInfo.isProduction ? LogLevel.Debug : LogLevel.Trace,
    }));
  }
}

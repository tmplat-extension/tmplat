import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { LoggingData } from 'extension/common/logging/data/logging-data.model';
import { loggingDataSchema } from 'extension/common/logging/data/logging-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';

export const LoggingDataRepositoryToken = Symbol('LoggingDataRepository');

@injectable()
export class LoggingDataRepository extends RequiredDataRepository<LoggingData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Logging, loggingDataSchema, dataService.sync);
  }

  install({ extensionInfo }: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      enabled: true,
      level: extensionInfo.isProduction ? LogLevel.Debug : LogLevel.Trace,
    }));
  }
}

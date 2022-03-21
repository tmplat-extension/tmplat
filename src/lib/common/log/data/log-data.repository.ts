import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { LogData } from 'extension/common/log/data/log-data.model';
import { logDataSchema } from 'extension/common/log/data/log-data.schema';
import { LogLevel } from 'extension/common/log/log-level.enum';

export const LogDataRepositoryToken = Symbol('LogDataRepository');

@injectable()
export class LogDataRepository extends DataRepository<LogData> implements DataInstaller {
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
  ) {
    super(DataNamespace.Log, logDataSchema, dataService.sync);
  }

  install(): Promise<void> {
    return this.set({
      enabled: !this.extensionInfo.isProduction,
      level: this.extensionInfo.isProduction ? LogLevel.Debug : LogLevel.Trace,
    });
  }

  isInstalled(): Promise<boolean> {
    return this.isNotEmpty();
  }
}

import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { type AppearanceData, AppearanceDataSchema } from 'extension/common/appearance/data/appearance-data.schema';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';

const AppearanceDataRepositoryName = 'AppearanceDataRepository';

export const AppearanceDataRepositoryToken = Symbol(AppearanceDataRepositoryName);

@injectable()
export class AppearanceDataRepository
  extends RequiredDataRepository<typeof AppearanceDataSchema, AppearanceData>
  implements DataInstaller
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    // The chosen appearance is device-specific (e.g. it may deliberately differ from a laptop to a monitor with
    // different lighting/orientation), so this deliberately uses local (device-only) storage rather than sync
    super({
      dataStorage: dataService.local,
      logger: logging.getLogger(AppearanceDataRepositoryName),
      namespace: DataNamespace.Appearance,
      schema: AppearanceDataSchema,
      validationService,
    });
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      mode: AppearanceMode.System,
    }));
  }
}

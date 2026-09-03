import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { AppearanceData } from 'extension/common/appearance/data/appearance-data.model';
import { appearanceDataSchema } from 'extension/common/appearance/data/appearance-data.schema';
import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';

export const AppearanceDataRepositoryToken = Symbol('AppearanceDataRepository');

@injectable()
export class AppearanceDataRepository extends RequiredDataRepository<AppearanceData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    // The chosen appearance is device-specific (e.g. it may deliberately differ from a laptop to a monitor with
    // different lighting/orientation), so this deliberately uses local (device-only) storage rather than sync
    super(DataNamespace.Appearance, appearanceDataSchema, dataService.local);
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      mode: AppearanceMode.System,
    }));
  }
}

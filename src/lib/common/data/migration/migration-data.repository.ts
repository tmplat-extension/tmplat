import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { MigrationData } from 'extension/common/data/migration/migration-data.model';
import { migrationDataSchema } from 'extension/common/data/migration/migration-data.schema';
import { inject, injectable } from 'extension/common/di';

export const MigrationDataRepositoryToken = Symbol('MigrationDataRepository');

@injectable()
export class MigrationDataRepository extends RequiredDataRepository<MigrationData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Migration, migrationDataSchema, dataService.sync);
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({ versions: [] }));
  }
}

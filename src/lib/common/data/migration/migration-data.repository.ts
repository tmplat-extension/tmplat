import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { MigrationData } from 'extension/common/data/migration/migration-data.model';
import { migrationDataSchema } from 'extension/common/data/migration/migration-data.schema';
import { inject, injectable } from 'extension/common/di';

export const MigrationDataRepositoryToken = Symbol('MigrationDataRepository');

@injectable()
export class MigrationDataRepository extends DataRepository<MigrationData> {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Migration, migrationDataSchema, dataService.sync);
  }
}

import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { type MigrationData, MigrationDataSchema } from 'extension/common/data/migration/migration-data.schema';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';

const MigrationDataRepositoryName = 'MigrationDataRepository';

export const MigrationDataRepositoryToken = Symbol(MigrationDataRepositoryName);

@injectable()
export class MigrationDataRepository
  extends RequiredDataRepository<typeof MigrationDataSchema, MigrationData>
  implements DataInstaller
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    // Deliberately device-local rather than synced. This records what has happened to *this* profile's data, and the
    // data it describes - notably the templates - is itself local. Syncing it would let a second device read that a
    // migration had completed when it never ran against that device's data
    super({
      dataStorage: dataService.local,
      logger: logging.getLogger(MigrationDataRepositoryName),
      namespace: DataNamespace.Migration,
      schema: MigrationDataSchema,
      validationService,
    });
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({ versions: [] }));
  }
}

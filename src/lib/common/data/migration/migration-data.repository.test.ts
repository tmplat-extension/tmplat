import { describe, expect, it } from 'vitest';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { MigrationDataRepository } from 'extension/common/data/migration/migration-data.repository';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { asDataService, FakeDataService } from 'extension/test/data-service.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const LEGACY_VERSION = '1.2.9' as ExtensionVersion;

const createRepository = () => {
  const dataService = new FakeDataService();
  const logging = createLoggingServiceMock();
  const repository = new MigrationDataRepository(
    asDataService(dataService),
    logging as unknown as LoggingService,
    new ValidationService(logging as unknown as LoggingService),
  );

  return { dataService, repository };
};

describe('MigrationDataRepository', () => {
  describe('install', () => {
    it('stores empty migration data and resolves true when the namespace is empty', async () => {
      const { dataService, repository } = createRepository();

      await expect(repository.install({} as DataInstallContext)).resolves.toBe(true);

      expect(dataService.sync.snapshot()).toEqual({ [DataNamespace.Migration]: { versions: [] } });
    });

    it('leaves existing migration data untouched and resolves false', async () => {
      const existing = { versions: [{ phase: MigrationPhase.Started, version: LEGACY_VERSION }] };
      const { dataService, repository } = createRepository();
      await dataService.sync.set(DataNamespace.Migration, existing);

      await expect(repository.install({} as DataInstallContext)).resolves.toBe(false);

      expect(dataService.sync.snapshot()).toEqual({ [DataNamespace.Migration]: existing });
    });
  });
});

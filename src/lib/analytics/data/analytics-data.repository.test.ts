import { describe, expect, it } from 'vitest';
import { AnalyticsDataRepository } from 'extension/analytics/data/analytics-data.repository';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const createRepository = (initial: Record<string, unknown> = {}) => {
  const storage = new FakeDataStorage(initial);
  const dataService = { sync: storage } as unknown as DataService;
  const repository = new AnalyticsDataRepository(
    dataService,
    createLoggingServiceMock() as unknown as LoggingService,
    new ValidationService(createLoggingServiceMock() as never),
  );

  return { repository, storage };
};

describe('AnalyticsDataRepository', () => {
  it('exposes the analytics namespace', () => {
    expect(createRepository().repository.namespace).toBe(DataNamespace.Analytics);
  });

  describe('install', () => {
    it('seeds a generated client id with analytics disabled by default', async () => {
      const { repository, storage } = createRepository();

      await expect(repository.install({} as DataInstallContext)).resolves.toBe(true);

      const stored = storage.snapshot()[DataNamespace.Analytics] as { clientId: string; enabled: boolean };
      expect(stored.enabled).toBe(false);
      expect(stored.clientId).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('leaves existing data untouched and resolves false', async () => {
      const existing = { clientId: '22222222-2222-4222-8222-222222222222', enabled: true };
      const { repository, storage } = createRepository({ [DataNamespace.Analytics]: existing });

      await expect(repository.install({} as DataInstallContext)).resolves.toBe(false);
      expect(storage.snapshot()[DataNamespace.Analytics]).toEqual(existing);
    });

    it('generates a distinct client id per install', async () => {
      const first = createRepository();
      const second = createRepository();

      await first.repository.install({} as DataInstallContext);
      await second.repository.install({} as DataInstallContext);

      const firstId = (first.storage.snapshot()[DataNamespace.Analytics] as { clientId: string }).clientId;
      const secondId = (second.storage.snapshot()[DataNamespace.Analytics] as { clientId: string }).clientId;
      expect(firstId).not.toBe(secondId);
    });

    it('seeds a client id that satisfies its own schema', async () => {
      const { repository, storage } = createRepository();
      await repository.install({} as DataInstallContext);

      const stored = storage.snapshot()[DataNamespace.Analytics];
      // A round-trip through `get` re-validates against `AnalyticsDataSchema`, so it would reject a non-uuid id.
      await expect(repository.get()).resolves.toEqual(stored);
    });
  });
});

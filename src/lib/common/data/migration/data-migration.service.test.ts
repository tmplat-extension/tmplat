import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationService } from 'extension/common/data/migration/data-migration.service';
import { MigrationDataRepository } from 'extension/common/data/migration/migration-data.repository';
import { type MigrationData } from 'extension/common/data/migration/migration-data.schema';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { ExtensionInfo } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { type TabService } from 'extension/tab/tab.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const LEGACY_VERSION = '1.2.9' as ExtensionVersion;
const UNKNOWN_VERSION = '1.2.8' as ExtensionVersion;

const createService = (seed?: MigrationData) => {
  const storage = new FakeDataStorage(seed === undefined ? {} : { [DataNamespace.Migration]: seed });
  const logging = createLoggingServiceMock();
  const repository = new MigrationDataRepository(
    { sync: storage } as unknown as DataService,
    logging as unknown as LoggingService,
    new ValidationService(logging as unknown as LoggingService),
  );
  const createExtensionTab = vi.fn<TabService['createExtensionTab']>(async () => undefined);
  const tabService = { createExtensionTab } as unknown as TabService;
  const service = new DataMigrationService(logging as unknown as LoggingService, repository, tabService);

  return { createExtensionTab, logging, service, storage };
};

describe('DataMigrationService', () => {
  describe('advanceMigrationPhase', () => {
    it('returns false for an unknown migration version without reading or seeding data', async () => {
      const { service, storage } = createService();

      await expect(service.advanceMigrationPhase(UNKNOWN_VERSION, MigrationPhase.Initiated)).resolves.toBe(false);

      expect(storage.snapshot()).toEqual({});
    });

    it('appends version data when advancing a known version for the first time', async () => {
      const { logging, service, storage } = createService();

      await expect(service.advanceMigrationPhase(LEGACY_VERSION, MigrationPhase.Initiated)).resolves.toBe(true);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Initiated, version: LEGACY_VERSION }] },
      });
      expect(logging.logger.info).toHaveBeenCalledWith("Advanced extension migration from v1.2.9 to 'Initiated'");
    });

    it('advances monotonically and refuses equal or backwards phase changes', async () => {
      const { service, storage } = createService({
        versions: [{ phase: MigrationPhase.Started, version: LEGACY_VERSION }],
      });

      await expect(service.advanceMigrationPhase(LEGACY_VERSION, MigrationPhase.Pending)).resolves.toBe(false);
      await expect(service.advanceMigrationPhase(LEGACY_VERSION, MigrationPhase.Started)).resolves.toBe(false);
      await expect(service.advanceMigrationPhase(LEGACY_VERSION, MigrationPhase.Completed)).resolves.toBe(true);
      await expect(service.advanceMigrationPhase(LEGACY_VERSION, MigrationPhase.Initiated)).resolves.toBe(false);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: LEGACY_VERSION }] },
      });
    });
  });

  describe('getMigrationPhase', () => {
    it('returns undefined for an unknown migration version without reading or seeding data', async () => {
      const { service, storage } = createService();

      await expect(service.getMigrationPhase(UNKNOWN_VERSION)).resolves.toBeUndefined();

      expect(storage.snapshot()).toEqual({});
    });

    it('lazily seeds empty migration data and returns Pending when no entry exists for a known version', async () => {
      const { service, storage } = createService();

      await expect(service.getMigrationPhase(LEGACY_VERSION)).resolves.toBe(MigrationPhase.Pending);

      expect(storage.snapshot()).toEqual({ [DataNamespace.Migration]: { versions: [] } });
    });

    it('returns the stored phase for a known version', async () => {
      const { service } = createService({ versions: [{ phase: MigrationPhase.Completed, version: LEGACY_VERSION }] });

      await expect(service.getMigrationPhase(LEGACY_VERSION)).resolves.toBe(MigrationPhase.Completed);
    });
  });

  describe('initiateMigration', () => {
    // Regression guard for a fixed bug: this used to build the tab URL with `new URL('migrate.html')`, which has no
    // base and therefore threw `TypeError: Invalid URL` unconditionally, so the one-off migration UI never opened for
    // anyone upgrading from the legacy extension. The path is now left relative for `createExtensionTab` to resolve.
    it('advances the phase and opens migrate.html with the version query param', async () => {
      const { createExtensionTab, service, storage } = createService();

      await expect(service.initiateMigration(LEGACY_VERSION)).resolves.toBeUndefined();

      expect(createExtensionTab).toHaveBeenCalledWith(`migrate.html?version=${LEGACY_VERSION}`);
      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Initiated, version: LEGACY_VERSION }] },
      });
    });

    it('passes a path that resolves to an absolute extension URL retaining the version', async () => {
      const { createExtensionTab, service } = createService();

      await service.initiateMigration(LEGACY_VERSION);

      // Asserting the argument alone would not have caught the original bug, since the invalid URL was only rejected
      // once resolved; run the real resolution the TabService performs
      const url = new ExtensionInfo().createExtensionUrl(createExtensionTab.mock.calls[0]?.[0]);

      expect(url.protocol).toBe('chrome-extension:');
      expect(url.pathname).toBe('/migrate.html');
      expect(url.searchParams.get('version')).toBe(LEGACY_VERSION);
    });

    it('wraps a tab creation failure as MIG500200 rather than leaking the raw error', async () => {
      const { createExtensionTab, service } = createService();
      const cause = new Error('no tabs permission');
      createExtensionTab.mockRejectedValue(cause);

      await expect(service.initiateMigration(LEGACY_VERSION)).rejects.toMatchObject({ cause, code: 'MIG500200' });
    });

    it('does not throw synchronously', async () => {
      const { createExtensionTab, service } = createService();
      createExtensionTab.mockRejectedValue(new Error('no tabs permission'));
      let promise!: Promise<unknown>;

      // A non-async method returning a Promise can still throw synchronously and bypass a caller's `.catch()`
      expect(() => {
        promise = service.initiateMigration(LEGACY_VERSION);
      }).not.toThrow();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('isMigrationRequired', () => {
    it.each([
      ['unknown version', UNKNOWN_VERSION, undefined, false],
      ['known version with no stored phase', LEGACY_VERSION, undefined, true],
      ['known version still pending', LEGACY_VERSION, MigrationPhase.Pending, true],
      ['known version already initiated', LEGACY_VERSION, MigrationPhase.Initiated, true],
      ['known version already started', LEGACY_VERSION, MigrationPhase.Started, true],
      ['known version completed', LEGACY_VERSION, MigrationPhase.Completed, false],
    ])('reports whether migration is required for %s', async (_label, version, phase, expected) => {
      const seed = phase === undefined ? undefined : { versions: [{ phase, version: LEGACY_VERSION }] };
      const { service } = createService(seed);

      await expect(service.isMigrationRequired(version)).resolves.toBe(expected);
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
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
/*
 * An earlier 1.x release. Chrome updates a long-idle browser straight to the latest version, so arriving from one
 * of the 33 releases before 1.2.9 is an ordinary upgrade path, not an exotic one - and those users carry exactly
 * the same legacy data format that the '1.2.9' migration consumes.
 */
const EARLIER_LEGACY_VERSION = '1.2.8' as ExtensionVersion;

const createService = (seed?: MigrationData) => {
  const storage = new FakeDataStorage(seed === undefined ? {} : { [DataNamespace.Migration]: seed });
  const logging = createLoggingServiceMock();
  const repository = new MigrationDataRepository(
    { local: storage } as unknown as DataService,
    logging as unknown as LoggingService,
    new ValidationService(logging as unknown as LoggingService),
  );
  const createExtensionTab = vi.fn<TabService['createExtensionTab']>(async () => undefined);
  const tabService = { createExtensionTab } as unknown as TabService;
  const legacyStorage = { local: new FakeDataStorage(), session: new FakeDataStorage() };
  const service = new DataMigrationService(
    legacyStorage as unknown as LegacyDataService,
    logging as unknown as LoggingService,
    repository,
    tabService,
  );

  return { createExtensionTab, legacyStorage, logging, service, storage };
};

describe('DataMigrationService', () => {
  describe('advanceMigrationPhase', () => {
    /*
     * Regression guard. Phases track the progress of *this user's* upgrade, so they are keyed on the version the
     * user came from - which is generally NOT a migration version. This used to be gated on `migrationVersions`,
     * so no phase was ever recorded for anyone upgrading from other than exactly 1.2.9.
     */
    it('records a phase for a version that is not itself a migration version', async () => {
      const { service, storage } = createService();

      await expect(service.advanceMigrationPhase(EARLIER_LEGACY_VERSION, MigrationPhase.Initiated)).resolves.toBe(true);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: {
          versions: [{ phase: MigrationPhase.Initiated, version: EARLIER_LEGACY_VERSION }],
        },
      });
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
    // Regression guard; see `advanceMigrationPhase` above for why phases are not gated on `migrationVersions`.
    it('returns Pending for a version that is not itself a migration version', async () => {
      const { service, storage } = createService();

      await expect(service.getMigrationPhase(EARLIER_LEGACY_VERSION)).resolves.toBe(MigrationPhase.Pending);

      expect(storage.snapshot()).toEqual({ [DataNamespace.Migration]: { versions: [] } });
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

  describe('getRequiredMigrationVersions', () => {
    /*
     * Regression guard for the core of MIGRATION-GAPS.md §1.5. A migration is named after the last version whose
     * data format it consumes, so the '1.2.9' migration applies to anyone arriving from 1.2.9 *or earlier* - their
     * data is in the very format it reads. The filter was inverted, so every one of the 33 releases before 1.2.9
     * was silently excluded and those users were never migrated at all.
     */
    it.each([
      ['the release immediately before it', EARLIER_LEGACY_VERSION],
      ['a much earlier 1.x release', '1.0.0' as ExtensionVersion],
      ['the earliest released version', '0.0.2' as ExtensionVersion],
    ])('includes a migration when migrating from %s', async (_label, version) => {
      const { service } = createService();

      await expect(service.getRequiredMigrationVersions(version)).resolves.toEqual([LEGACY_VERSION]);
    });

    it('includes a known version that has never been migrated', async () => {
      const { service } = createService();

      await expect(service.getRequiredMigrationVersions(LEGACY_VERSION)).resolves.toEqual([LEGACY_VERSION]);
    });

    it.each([
      ['pending', MigrationPhase.Pending, [LEGACY_VERSION]],
      ['initiated', MigrationPhase.Initiated, [LEGACY_VERSION]],
      ['started', MigrationPhase.Started, [LEGACY_VERSION]],
      ['completed', MigrationPhase.Completed, []],
    ])('omits only completed versions (%s)', async (_label, phase, expected) => {
      const { service } = createService({ versions: [{ phase, version: LEGACY_VERSION }] });

      await expect(service.getRequiredMigrationVersions(LEGACY_VERSION)).resolves.toEqual(expected);
    });

    /*
     * Regression guard for MIGRATION-GAPS.md §1.6. Completion is recorded against the version the *user* upgraded
     * from, but the phase used to be looked up by the migration version - which names a data format, so it never
     * matched. A completed migration therefore kept reporting itself as required, and `migrate.html` previewed an
     * upgrade that had already happened. The case above hides this by seeding and querying the same version.
     */
    it('omits a version completed by a user who upgraded from an earlier release', async () => {
      const { service } = createService({
        versions: [{ phase: MigrationPhase.Completed, version: EARLIER_LEGACY_VERSION }],
      });

      await expect(service.getRequiredMigrationVersions(EARLIER_LEGACY_VERSION)).resolves.toEqual([]);
    });

    // The phase belongs to one user's upgrade, so another starting point has its own progress to make
    it('still requires a version for a user whose own upgrade has not completed', async () => {
      const { service } = createService({
        versions: [{ phase: MigrationPhase.Completed, version: EARLIER_LEGACY_VERSION }],
      });

      await expect(service.getRequiredMigrationVersions(LEGACY_VERSION)).resolves.toEqual([LEGACY_VERSION]);
    });

    // The mirror image: a 2.0.0 user never wrote 1.x data, so the legacy migration does not apply to them
    it('excludes a migration older than the version being migrated from', async () => {
      const { service, storage } = createService();

      await expect(service.getRequiredMigrationVersions('2.0.0' as ExtensionVersion)).resolves.toEqual([]);

      expect(storage.snapshot()).toEqual({});
    });

    it('does not throw synchronously', async () => {
      const { service } = createService();
      let promise!: Promise<unknown>;

      expect(() => {
        promise = service.getRequiredMigrationVersions(LEGACY_VERSION);
      }).not.toThrow();

      await expect(promise).resolves.toEqual([LEGACY_VERSION]);
    });
  });

  describe('exportLegacyData', () => {
    it('dumps both legacy storages so the user can keep a copy of data a migration will delete', async () => {
      const { legacyStorage, service } = createService();
      await legacyStorage.local.setAll({ logger: { enabled: 'yes' }, templates: [{ title: 'Example' }] });
      await legacyStorage.session.setAll({ toolbar: { popup: 'yes' } });

      await expect(service.exportLegacyData()).resolves.toEqual({
        local: { logger: { enabled: 'yes' }, templates: [{ title: 'Example' }] },
        session: { toolbar: { popup: 'yes' } },
      });
    });

    it('reports empty storages rather than omitting them, so the shape of the export never varies', async () => {
      const { service } = createService();

      await expect(service.exportLegacyData()).resolves.toEqual({ local: {}, session: {} });
    });

    it('wraps a read failure as MIG500400 rather than leaking the raw error', async () => {
      const { legacyStorage, service } = createService();
      const cause = new Error('storage unavailable');
      vi.spyOn(legacyStorage.session, 'all').mockRejectedValue(cause);

      await expect(service.exportLegacyData()).rejects.toMatchObject({ cause, code: 'MIG500400' });
    });

    it('does not throw synchronously', async () => {
      const { legacyStorage, service } = createService();
      vi.spyOn(legacyStorage.local, 'all').mockRejectedValue(new Error('storage unavailable'));
      let promise!: Promise<unknown>;

      expect(() => {
        promise = service.exportLegacyData();
      }).not.toThrow();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('removeLegacyData', () => {
    it('removes each key from the storage it was reported against, leaving other keys alone', async () => {
      const { legacyStorage, logging, service } = createService();
      await legacyStorage.local.setAll({ keep: 'me', logger: { enabled: 'yes' }, templates: [] });
      await legacyStorage.session.setAll({ logger: 'session', toolbar: {} });

      await service.removeLegacyData([
        { key: 'logger', storage: 'local' },
        { key: 'templates', storage: 'local' },
        { key: 'toolbar', storage: 'session' },
      ]);

      expect(legacyStorage.local.snapshot()).toEqual({ keep: 'me' });
      expect(legacyStorage.session.snapshot()).toEqual({ logger: 'session' });
      expect(logging.logger.info).toHaveBeenCalledWith('Removed legacy data blocking extension migration', {
        keys: ['logger', 'templates'],
        storage: 'local',
      });
    });

    it('ignores keys that no longer exist, so a retry after a partial removal still succeeds', async () => {
      const { legacyStorage, service } = createService();
      await legacyStorage.local.setAll({ keep: 'me' });

      await expect(service.removeLegacyData([{ key: 'gone', storage: 'local' }])).resolves.toBeUndefined();

      expect(legacyStorage.local.snapshot()).toEqual({ keep: 'me' });
    });

    it('touches no storage when given nothing to remove', async () => {
      const { legacyStorage, service } = createService();
      const removeAll = vi.spyOn(legacyStorage.local, 'removeAll');

      await service.removeLegacyData([]);

      expect(removeAll).not.toHaveBeenCalled();
    });

    it('wraps a removal failure as MIG500300 rather than leaking the raw error', async () => {
      const { legacyStorage, service } = createService();
      const cause = new Error('storage unavailable');
      vi.spyOn(legacyStorage.session, 'removeAll').mockRejectedValue(cause);

      await expect(service.removeLegacyData([{ key: 'logger', storage: 'session' }])).rejects.toMatchObject({
        cause,
        code: 'MIG500300',
      });
    });

    it('does not throw synchronously', async () => {
      const { legacyStorage, service } = createService();
      vi.spyOn(legacyStorage.local, 'removeAll').mockRejectedValue(new Error('storage unavailable'));
      let promise!: Promise<unknown>;

      expect(() => {
        promise = service.removeLegacyData([{ key: 'logger', storage: 'local' }]);
      }).not.toThrow();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('resetMigrationPhase', () => {
    /*
     * The explicit retry path. `advanceMigrationPhase` deliberately refuses to move a phase backwards, so without
     * this a migration that finished with failed steps could never be run again - which made `removeLegacyData`,
     * whose entire purpose is "discard the bad data and retry", unreachable.
     */
    it('takes a completed migration back to Pending so that it can be run again', async () => {
      const { service, storage } = createService({
        versions: [{ phase: MigrationPhase.Completed, version: LEGACY_VERSION }],
      });

      await expect(service.resetMigrationPhase(LEGACY_VERSION)).resolves.toBe(true);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Pending, version: LEGACY_VERSION }] },
      });
      await expect(service.isMigrationRequired(LEGACY_VERSION)).resolves.toBe(true);
    });

    it('leaves other versions untouched', async () => {
      const { service, storage } = createService({
        versions: [
          { phase: MigrationPhase.Completed, version: LEGACY_VERSION },
          { phase: MigrationPhase.Completed, version: EARLIER_LEGACY_VERSION },
        ],
      });

      await service.resetMigrationPhase(LEGACY_VERSION);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: {
          versions: [
            { phase: MigrationPhase.Pending, version: LEGACY_VERSION },
            { phase: MigrationPhase.Completed, version: EARLIER_LEGACY_VERSION },
          ],
        },
      });
    });

    it.each([
      ['a version that was never recorded', undefined],
      ['a version already pending', MigrationPhase.Pending],
    ])('reports that nothing changed for %s, and records no new phase', async (_label, phase) => {
      const seed = phase === undefined ? undefined : { versions: [{ phase, version: LEGACY_VERSION }] };
      const { service, storage } = createService(seed);

      await expect(service.resetMigrationPhase(LEGACY_VERSION)).resolves.toBe(false);

      // `getData` seeds an empty record on first read, so the namespace itself may appear; what matters is that no
      // phase was written.
      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: { versions: seed?.versions ?? [] },
      });
    });
  });

  describe('isMigrationRequired', () => {
    it.each([
      ['an earlier 1.x version with no stored phase', EARLIER_LEGACY_VERSION, undefined, true],
      ['a version newer than every migration', '2.0.0' as ExtensionVersion, undefined, false],
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

    // §1.6 again, from the caller that decides whether to open the migration tab on upgrade
    it('is not required once an earlier 1.x upgrade has completed', async () => {
      const { service } = createService({
        versions: [{ phase: MigrationPhase.Completed, version: EARLIER_LEGACY_VERSION }],
      });

      await expect(service.isMigrationRequired(EARLIER_LEGACY_VERSION)).resolves.toBe(false);
    });
  });
});

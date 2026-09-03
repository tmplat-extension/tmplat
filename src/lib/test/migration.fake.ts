import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
import { type DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { FakeDataStorage } from 'extension/test/data-storage.fake';

/**
 * The only version any migrator currently targets. Every `createSimpleStepFor*` step compares
 * `context.oldVersion` against this, so a step is a no-op for any other version.
 */
export const legacyMigrationVersion = '1.2.9' as ExtensionVersion;

/**
 * A real released version that is *not* {@link legacyMigrationVersion}, for asserting that a step correctly
 * declines to run on a different upgrade path.
 *
 * `ExtensionVersion` is a closed union generated from `docs/changelog.json`, so an invented version such as
 * `'1.3.0'` is a compile error — and one that scoped `vitest` runs will not catch, since rolldown only strips
 * types. Use this constant rather than a literal.
 */
export const nonMigrationVersion = '1.2.8' as ExtensionVersion;

/**
 * Builds a {@link DataMigrationContext} backed by in-memory legacy storage.
 *
 * The real `LegacyDataService` wraps `localStorage`/`sessionStorage` via `DomDataStorage`; substituting
 * {@link FakeDataStorage} keeps migrator tests in the `node` project while still exercising the same
 * `DataStorage` contract (see `data-storage.test.ts`).
 *
 * `oldVersion` defaults to {@link legacyMigrationVersion} so the common "this step should run" case needs no
 * ceremony; pass another version to assert a step correctly declines.
 */
export const createMigrationContext = (
  legacyData: Record<string, unknown> = {},
  { oldVersion = legacyMigrationVersion, newVersion = '2.0.0' as ExtensionVersion }: CreateMigrationContextOptions = {},
): MigrationContextFixture => {
  const local = new FakeDataStorage(legacyData);
  const session = new FakeDataStorage();

  return {
    context: {
      legacyDataService: { local, session } as unknown as LegacyDataService,
      newVersion,
      oldVersion,
    },
    local,
    session,
  };
};

export type CreateMigrationContextOptions = {
  newVersion?: ExtensionVersion;
  oldVersion?: ExtensionVersion;
};

export type MigrationContextFixture = {
  readonly context: DataMigrationContext;
  /** The legacy `localStorage` fake, for seeding and for asserting that keys were removed. */
  readonly local: FakeDataStorage;
  readonly session: FakeDataStorage;
};

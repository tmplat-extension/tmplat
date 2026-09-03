import { type DataService } from 'extension/common/data/data.service';
import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import {
  type DataMigrationContext,
  type DataMigrationStepResult,
} from 'extension/common/data/migration/data-migration.model';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

/**
 * The only version any migrator currently targets. Every `createSimpleStepFor*` step compares
 * `context.oldVersion` against this, so a step is a no-op for any other version.
 */
export const legacyMigrationVersion = '1.2.9' as ExtensionVersion;

/**
 * A real released version that is *not* {@link legacyMigrationVersion}, for asserting that a step correctly
 * declines to run on a different upgrade path.
 *
 * `ExtensionVersion` is a closed union generated from `src/changelog.json`, so an invented version such as
 * `'1.3.0'` is a compile error — and one that scoped `vitest` runs will not catch, since rolldown only strips
 * types. Use this constant rather than a literal.
 */
export const nonMigrationVersion = '1.2.8' as ExtensionVersion;

/**
 * Builds the {@link DataMigrationStepResult} `AbstractDataMigrator` reports for a step that was *not required* on
 * this upgrade path.
 *
 * `migrate()` returns a result for every step, not just the required ones, so a test asserting on the full result
 * array has to account for the steps that did nothing. The reason is the message key rather than the copy because
 * the shared `IntlService` mock echoes keys.
 */
export const createNotRequiredStepResult = (description: string): DataMigrationStepResult => ({
  description,
  outcome: DataMigrationStepOutcome.Skipped,
  reasons: ['data_migration_step_skipped_reason'],
});

/**
 * Builds a {@link DataMigrationContext} backed by in-memory data storage.
 *
 * The real `DataService` and `LegacyDataService` wrap `browser.storage.*` via `BrowserDataStorage` and
 * `localStorage`/`sessionStorage` via `DomDataStorage` respectively; substituting {@link FakeDataStorage} keeps
 * migrator tests in the `node` project while still exercising the same `DataStorage` contract (see
 * `data-storage.test.ts`).
 *
 * `oldVersion` defaults to {@link legacyMigrationVersion} so the common "this step should run" case needs no
 * ceremony; pass another version to assert a step correctly declines.
 */
export const createMigrationContext = ({
  data = {},
  legacyData = {},
  oldVersion = legacyMigrationVersion,
  newVersion = '2.0.0' as ExtensionVersion,
  validationService = new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
}: CreateMigrationContextOptions = {}): MigrationContextFixture => {
  const dataFixture: MigrationContextDataFixture = {
    local: new FakeDataStorage(data.local),
    managed: new FakeDataStorage(data.managed),
    session: new FakeDataStorage(data.session),
    sync: new FakeDataStorage(data.sync),
  };
  const legacyDataFixture: MigrationContextDataFixture<'local' | 'session'> = {
    local: new FakeDataStorage(legacyData.local),
    session: new FakeDataStorage(legacyData.session),
  };

  return {
    context: {
      dataService: dataFixture as unknown as DataService,
      legacyDataService: legacyDataFixture as unknown as LegacyDataService,
      newVersion,
      oldVersion,
      validationService,
    },
    data: dataFixture,
    legacyData: legacyDataFixture,
    validationService,
  };
};

export type CreateMigrationContextDataOptions<Key extends string = 'local' | 'managed' | 'session' | 'sync'> = {
  [key in Key]?: Record<string, unknown>;
};

export type CreateMigrationContextOptions = {
  data?: CreateMigrationContextDataOptions;
  legacyData?: CreateMigrationContextDataOptions<'local' | 'session'>;
  newVersion?: ExtensionVersion;
  oldVersion?: ExtensionVersion;
  validationService?: ValidationService;
};

export type MigrationContextDataFixture<Key extends string = 'local' | 'managed' | 'session' | 'sync'> = {
  readonly [key in Key]: FakeDataStorage;
};

export type MigrationContextFixture = {
  readonly context: DataMigrationContext;
  readonly data: MigrationContextDataFixture;
  readonly legacyData: MigrationContextDataFixture<'local' | 'session'>;
  readonly validationService: ValidationService;
};

import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
import { DataMigrationManager } from 'extension/common/data/migration/data-migration-manager';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationStepResult } from 'extension/common/data/migration/data-migration.model';
import { DataMigrationService } from 'extension/common/data/migration/data-migration.service';
import { type DataMigrator } from 'extension/common/data/migration/data-migrator';
import { MigrationDataRepository } from 'extension/common/data/migration/migration-data.repository';
import { type MigrationData } from 'extension/common/data/migration/migration-data.schema';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { type TabService } from 'extension/tab/tab.service';
import { asDataService, FakeDataService } from 'extension/test/data-service.fake';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { legacyMigrationVersion } from 'extension/test/migration.fake';

const CURRENT_VERSION = '2.0.0' as ExtensionVersion;

const passedStep = (description = 'passed step'): DataMigrationStepResult => ({
  description,
  outcome: DataMigrationStepOutcome.Passed,
});

const skippedStep = (description = 'skipped step'): DataMigrationStepResult => ({
  description,
  outcome: DataMigrationStepOutcome.Skipped,
  reasons: ['not required'],
});

const failedStep = (description = 'failed step'): DataMigrationStepResult => ({
  description,
  errors: [ExtensionError.from('MIG500000')],
  outcome: DataMigrationStepOutcome.Failed,
});

const createMigrator = (
  namespace: DataNamespace,
  migrate: DataMigrator['migrate'] = vi.fn(async () => []),
): DataMigrator =>
  ({
    getRequiredMigrationSteps: vi.fn(async () => []),
    isMigrationRequired: vi.fn(async () => true),
    migrate,
    namespace,
    namespaceTitle: `data_namespace_${namespace}`,
  }) as DataMigrator;

const createManager = (migrators: DataMigrator[], seed?: MigrationData) => {
  const storage = new FakeDataStorage(seed === undefined ? {} : { [DataNamespace.Migration]: seed });
  const logging = createLoggingServiceMock();
  const validationService = new ValidationService(logging as unknown as LoggingService);
  const repository = new MigrationDataRepository(
    { sync: storage } as unknown as DataService,
    logging as unknown as LoggingService,
    validationService,
  );
  const service = new DataMigrationService(logging as unknown as LoggingService, repository, {
    createExtensionTab: vi.fn(async () => undefined),
  } as unknown as TabService);
  const extensionInfo = {
    convertStringToExtensionVersion: vi.fn((version: string) => version as ExtensionVersion),
    getVersion: vi.fn(() => CURRENT_VERSION),
  } as unknown as ExtensionInfo;
  const dataService = new FakeDataService();
  const legacyDataService = {
    local: new FakeDataStorage(),
    session: new FakeDataStorage(),
  } as unknown as LegacyDataService;
  const manager = new DataMigrationManager(
    asDataService(dataService),
    service,
    extensionInfo,
    legacyDataService,
    logging as unknown as LoggingService,
    migrators,
    validationService,
  );

  return { dataService, extensionInfo, legacyDataService, logging, manager, storage, validationService };
};

describe('DataMigrationManager', () => {
  it('exposes the configured migrator namespaces in order', () => {
    const migrators = [createMigrator(DataNamespace.Template), createMigrator(DataNamespace.OAuth)];
    const { manager } = createManager(migrators);

    expect(manager.namespaces).toEqual([DataNamespace.Template, DataNamespace.OAuth]);
  });

  it('rejects asynchronously with MIG409000 when migration is not required', async () => {
    const { manager } = createManager([], {
      versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }],
    });
    let promise!: Promise<unknown>;

    expect(() => {
      promise = manager.migrate(legacyMigrationVersion);
    }).not.toThrow();

    await expect(promise).rejects.toMatchObject({ code: 'MIG409000' });
  });

  describe('namespace outcomes', () => {
    // The namespace outcome answers "did this migrator get to run?" — it is deliberately NOT an aggregate of the
    // step outcomes, which carry their own detail. A namespace whose steps all failed still reports `Completed`,
    // because the migrator itself ran to completion; only a migrator that threw reports `Failed`.
    it('reports Completed and carries the step results through, whatever they were', async () => {
      const migrator = createMigrator(
        DataNamespace.OAuth,
        vi.fn(async () => [passedStep('ok'), skippedStep(), failedStep()]),
      );
      const { manager } = createManager([migrator]);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect(results).toEqual([
        {
          namespace: DataNamespace.OAuth,
          outcome: DataMigrationOutcome.Completed,
          steps: [passedStep('ok'), skippedStep(), failedStep()],
        },
      ]);
    });

    it('reports Completed with no steps when a migrator contributes none', async () => {
      const migrator = createMigrator(
        DataNamespace.Logging,
        vi.fn(async () => []),
      );
      const { manager } = createManager([migrator]);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect(results).toEqual([
        { namespace: DataNamespace.Logging, outcome: DataMigrationOutcome.Completed, steps: [] },
      ]);
    });

    it('reports Failed with the error, and no steps, when a migrator throws', async () => {
      const migrator = createMigrator(
        DataNamespace.Notification,
        vi.fn(async () => {
          throw new Error('boom');
        }),
      );
      const { manager } = createManager([migrator]);

      const { results } = await manager.migrate(legacyMigrationVersion);

      // The error is carried structurally rather than pre-stringified, so the UI can inspect the code and cause
      expect(results).toEqual([
        {
          namespace: DataNamespace.Notification,
          outcome: DataMigrationOutcome.Failed,
          error: expect.any(ExtensionError),
        },
      ]);
      expect(results[0]).not.toHaveProperty('steps');
      expect((results[0] as { error: ExtensionError }).error).toMatchObject({ code: 'MIG500000' });
    });

    it('preserves the original throw as the error cause', async () => {
      const cause = new Error('boom');
      const migrator = createMigrator(
        DataNamespace.Template,
        vi.fn(async () => {
          throw cause;
        }),
      );
      const { manager } = createManager([migrator]);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect((results[0] as { error: ExtensionError }).error.cause).toBe(cause);
    });

    it('passes an ExtensionError thrown by a migrator through unchanged', async () => {
      const thrown = ExtensionError.from('MIG404000', 'version');
      const migrator = createMigrator(
        DataNamespace.Template,
        vi.fn(async () => {
          throw thrown;
        }),
      );
      const { manager } = createManager([migrator]);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect((results[0] as { error: ExtensionError }).error).toBe(thrown);
    });

    it('isolates migrators from each other, so one throwing does not stop the rest', async () => {
      const throwing = createMigrator(
        DataNamespace.Template,
        vi.fn(async () => {
          throw new Error('boom');
        }),
      );
      const passing = createMigrator(
        DataNamespace.OAuth,
        vi.fn(async () => [passedStep()]),
      );
      const { manager, storage } = createManager([throwing, passing]);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect(results.map((result) => result.outcome)).toEqual([
        DataMigrationOutcome.Failed,
        DataMigrationOutcome.Completed,
      ]);
      // The migration still advances to Completed, so one broken namespace cannot strand the user mid-migration
      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }] },
      });
    });

    it('returns results in migrator registration order', async () => {
      const migrators = [
        createMigrator(DataNamespace.Template),
        createMigrator(DataNamespace.OAuth),
        createMigrator(DataNamespace.Logging),
      ];
      const { manager } = createManager(migrators);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect(results.map((result) => result.namespace)).toEqual([
        DataNamespace.Template,
        DataNamespace.OAuth,
        DataNamespace.Logging,
      ]);
    });
  });

  it('completes the migration and records the version as Completed', async () => {
    const migrator = createMigrator(
      DataNamespace.Template,
      vi.fn(async () => [passedStep()]),
    );
    const { manager, storage } = createManager([migrator]);

    await expect(manager.migrate(legacyMigrationVersion)).resolves.toEqual({
      results: [{ namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Completed, steps: [passedStep()] }],
      version: legacyMigrationVersion,
    });
    expect(storage.snapshot()).toEqual({
      [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }] },
    });
  });

  it('passes the expected migration context to each migrator', async () => {
    const migrate = vi.fn(async () => [passedStep()]);
    const migrator = createMigrator(DataNamespace.Analytics, migrate);
    const { dataService, legacyDataService, manager, validationService } = createManager([migrator]);

    await manager.migrate(legacyMigrationVersion);

    // `dataService` is what lets a step read or write the *new* data store; a migrator given only the legacy store
    // could never transfer anything into it
    expect(migrate).toHaveBeenCalledWith({
      dataService,
      legacyDataService,
      newVersion: CURRENT_VERSION,
      oldVersion: legacyMigrationVersion,
      validationService,
    });
  });

  it('returns unknown results without running migrators when the migration has already started', async () => {
    const first = createMigrator(
      DataNamespace.Template,
      vi.fn(async () => [passedStep()]),
    );
    const second = createMigrator(
      DataNamespace.OAuth,
      vi.fn(async () => [passedStep()]),
    );
    const { manager, storage } = createManager([first, second], {
      versions: [{ phase: MigrationPhase.Started, version: legacyMigrationVersion }],
    });

    // Guards against a refreshed migrate.html tab re-running destructive steps a second time
    await expect(manager.migrate(legacyMigrationVersion)).resolves.toEqual({
      results: [
        { namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Unknown },
        { namespace: DataNamespace.OAuth, outcome: DataMigrationOutcome.Unknown },
      ],
      version: legacyMigrationVersion,
    });
    expect(first.migrate).not.toHaveBeenCalled();
    expect(second.migrate).not.toHaveBeenCalled();
    expect(storage.snapshot()).toEqual({
      [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }] },
    });
  });

  it('reads and converts the version query param when no version is supplied', async () => {
    const migrator = createMigrator(DataNamespace.Template);
    const { extensionInfo, manager } = createManager([migrator]);
    vi.stubGlobal('document', {
      documentURI: 'chrome-extension://abc/migrate.html?version=1.2.9',
    });

    await expect(manager.migrate()).resolves.toMatchObject({ version: legacyMigrationVersion });

    expect(extensionInfo.convertStringToExtensionVersion).toHaveBeenCalledWith('1.2.9');
  });

  it('rejects asynchronously with MIG404000 when the version query param is absent', async () => {
    const { manager } = createManager([]);
    vi.stubGlobal('document', {
      documentURI: 'chrome-extension://abc/migrate.html',
    });
    let promise!: Promise<unknown>;

    expect(() => {
      promise = manager.migrate();
    }).not.toThrow();

    await expect(promise).rejects.toMatchObject({ code: 'MIG404000' });
  });
});

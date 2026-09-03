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
  getRequiredMigrationSteps: DataMigrator['getRequiredMigrationSteps'] = vi.fn(async () => []),
): DataMigrator =>
  ({
    getRequiredMigrationSteps,
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
    { local: storage } as unknown as DataService,
    logging as unknown as LoggingService,
    validationService,
  );
  const legacyStorage = {
    local: new FakeDataStorage(),
    session: new FakeDataStorage(),
  };
  const legacyDataService = legacyStorage as unknown as LegacyDataService;
  const service = new DataMigrationService(legacyDataService, logging as unknown as LoggingService, repository, {
    createExtensionTab: vi.fn(async () => undefined),
  } as unknown as TabService);
  const extensionInfo = {
    convertStringToExtensionVersion: vi.fn((version: string) => version as ExtensionVersion),
    getVersion: vi.fn(() => CURRENT_VERSION),
  } as unknown as ExtensionInfo;
  const dataService = new FakeDataService();
  const manager = new DataMigrationManager(
    asDataService(dataService),
    service,
    extensionInfo,
    legacyDataService,
    logging as unknown as LoggingService,
    migrators,
    validationService,
  );

  return {
    dataService,
    extensionInfo,
    legacyDataService,
    legacyStorage,
    logging,
    manager,
    storage,
    validationService,
  };
};

describe('DataMigrationManager', () => {
  it('exposes the configured migrator namespaces in order', () => {
    const migrators = [createMigrator(DataNamespace.Template), createMigrator(DataNamespace.Appearance)];
    const { manager } = createManager(migrators);

    expect(manager.namespaces).toEqual([DataNamespace.Template, DataNamespace.Appearance]);
  });

  describe('removeLegacyData', () => {
    it('removes each key from the storage it was reported against', async () => {
      const { legacyStorage, manager } = createManager([]);
      await legacyStorage.local.setAll({ keep: 'me', logger: { enabled: 'yes' } });
      await legacyStorage.session.setAll({ toolbar: {} });

      await manager.removeLegacyData([
        { key: 'logger', storage: 'local' },
        { key: 'toolbar', storage: 'session' },
      ]);

      expect(legacyStorage.local.snapshot()).toEqual({ keep: 'me' });
      expect(legacyStorage.session.snapshot()).toEqual({});
    });

    it('rejects with MIG500300 when the removal fails, without throwing synchronously', async () => {
      const { legacyStorage, manager } = createManager([]);
      const cause = new Error('storage unavailable');
      vi.spyOn(legacyStorage.local, 'removeAll').mockRejectedValue(cause);
      let promise!: Promise<unknown>;

      expect(() => {
        promise = manager.removeLegacyData([{ key: 'logger', storage: 'local' }]);
      }).not.toThrow();

      await expect(promise).rejects.toMatchObject({ cause, code: 'MIG500300' });
    });
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
        DataNamespace.Appearance,
        vi.fn(async () => [passedStep('ok'), skippedStep(), failedStep()]),
      );
      const { manager } = createManager([migrator]);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect(results).toEqual([
        {
          namespace: DataNamespace.Appearance,
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
        DataNamespace.Appearance,
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
        createMigrator(DataNamespace.Appearance),
        createMigrator(DataNamespace.Logging),
      ];
      const { manager } = createManager(migrators);

      const { results } = await manager.migrate(legacyMigrationVersion);

      expect(results.map((result) => result.namespace)).toEqual([
        DataNamespace.Template,
        DataNamespace.Appearance,
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
    const migrator = createMigrator(DataNamespace.Logging, migrate);
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

  /*
   * Regression guard for MIGRATION-GAPS.md §1.5. The context has to carry the *migration* version, not the version
   * the user upgraded from: every step opts in with `oldVersion === targetOldVersion` (see
   * `DataMigrationStepBuilder`), so passing the user's version made every step a silent no-op for anyone not
   * arriving from exactly 1.2.9 - while still advancing the phase to Completed, so it was never retried. It also
   * disagreed with `getRequiredMigrations`, which the migrate UI uses to preview those very same steps.
   */
  it('passes the migration version as the old version, not the version the user upgraded from', async () => {
    const earlierVersion = '1.2.8' as ExtensionVersion;
    const migrate = vi.fn(async () => [passedStep()]);
    const migrator = createMigrator(DataNamespace.Logging, migrate);
    const { dataService, legacyDataService, manager, validationService } = createManager([migrator]);

    await manager.migrate(earlierVersion);

    expect(migrate).toHaveBeenCalledWith({
      dataService,
      legacyDataService,
      newVersion: CURRENT_VERSION,
      oldVersion: legacyMigrationVersion,
      validationService,
    });
  });

  it('migrates a user arriving from an earlier 1.x release rather than rejecting with MIG409000', async () => {
    const migrator = createMigrator(
      DataNamespace.Logging,
      vi.fn(async () => [passedStep()]),
    );
    const { manager } = createManager([migrator]);

    await expect(manager.migrate('1.0.0' as ExtensionVersion)).resolves.toEqual({
      results: [{ namespace: DataNamespace.Logging, outcome: DataMigrationOutcome.Completed, steps: [passedStep()] }],
      version: '1.0.0',
    });
  });

  it('returns unknown results without running migrators when the migration has already started', async () => {
    const first = createMigrator(
      DataNamespace.Template,
      vi.fn(async () => [passedStep()]),
    );
    const second = createMigrator(
      DataNamespace.Appearance,
      vi.fn(async () => [passedStep()]),
    );
    const { manager, storage } = createManager([first, second], {
      versions: [{ phase: MigrationPhase.Started, version: legacyMigrationVersion }],
    });

    // Guards against a refreshed migrate.html tab re-running destructive steps a second time
    await expect(manager.migrate(legacyMigrationVersion)).resolves.toEqual({
      results: [
        { namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Unknown },
        { namespace: DataNamespace.Appearance, outcome: DataMigrationOutcome.Unknown },
      ],
      version: legacyMigrationVersion,
    });
    expect(first.migrate).not.toHaveBeenCalled();
    expect(second.migrate).not.toHaveBeenCalled();
    expect(storage.snapshot()).toEqual({
      [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }] },
    });
  });

  describe('retryMigration', () => {
    /*
     * `migrate` advances the phase to Completed whatever happened to the individual steps, and then refuses to run
     * again. That guard is deliberate - it stops a *refreshed* tab re-running destructive steps - but it also meant
     * a migration that finished with failures was terminal, so `removeLegacyData`'s documented "discard the data
     * and retry" workflow could never actually be completed. An explicit retry resets the phase first.
     */
    it('runs a completed migration again, which migrate alone refuses to do', async () => {
      const migrate = vi.fn(async () => [passedStep()]);
      const { manager } = createManager([createMigrator(DataNamespace.Template, migrate)]);

      await manager.migrate(legacyMigrationVersion);
      expect(migrate).toHaveBeenCalledTimes(1);

      // A second plain `migrate` is rejected outright, so the retry has to go through `retryMigration`
      await expect(manager.migrate(legacyMigrationVersion)).rejects.toMatchObject({ code: 'MIG409000' });

      await expect(manager.retryMigration(legacyMigrationVersion)).resolves.toEqual({
        results: [
          { namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Completed, steps: [passedStep()] },
        ],
        version: legacyMigrationVersion,
      });
      expect(migrate).toHaveBeenCalledTimes(2);
    });

    it('records the migration as Completed again once the retry finishes', async () => {
      const { manager, storage } = createManager([createMigrator(DataNamespace.Template)], {
        versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }],
      });

      await manager.retryMigration(legacyMigrationVersion);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }] },
      });
    });

    /*
     * The `Started` guard exists to protect an *accidental* re-entry (a refreshed tab), not a deliberate one. An
     * explicit retry must get past it, otherwise a migration interrupted part-way through could never be resumed.
     */
    it('gets past the Started guard that leaves a refreshed tab with Unknown results', async () => {
      const migrate = vi.fn(async () => [passedStep()]);
      const { manager } = createManager([createMigrator(DataNamespace.Template, migrate)], {
        versions: [{ phase: MigrationPhase.Started, version: legacyMigrationVersion }],
      });

      const { results } = await manager.retryMigration(legacyMigrationVersion);

      expect(results).toEqual([
        { namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Completed, steps: [passedStep()] },
      ]);
      expect(migrate).toHaveBeenCalledTimes(1);
    });

    it('does not throw synchronously', async () => {
      const { manager } = createManager([createMigrator(DataNamespace.Template)]);
      let promise!: Promise<unknown>;

      expect(() => {
        promise = manager.retryMigration('9.9.9' as ExtensionVersion);
      }).not.toThrow();

      await expect(promise).rejects.toMatchObject({ code: 'MIG409000' });
    });
  });

  describe('exportLegacyData', () => {
    it('hands back everything in both legacy storages, so a backup can be taken before migrating', async () => {
      const { legacyStorage, manager } = createManager([createMigrator(DataNamespace.Template)]);
      await legacyStorage.local.setAll({ templates: [{ title: 'Example' }] });
      await legacyStorage.session.setAll({ toolbar: { popup: 'yes' } });

      await expect(manager.exportLegacyData()).resolves.toEqual({
        local: { templates: [{ title: 'Example' }] },
        session: { toolbar: { popup: 'yes' } },
      });
    });
  });

  describe('getRequiredMigrations', () => {
    it('groups the required steps of each migrator by version and namespace', async () => {
      const appearance = createMigrator(
        DataNamespace.Appearance,
        undefined,
        vi.fn(async () => ['transfer tokens']),
      );
      const template = createMigrator(
        DataNamespace.Template,
        undefined,
        vi.fn(async () => ['transfer templates', 'remove legacy templates']),
      );
      const { manager } = createManager([appearance, template]);

      await expect(manager.getRequiredMigrations(legacyMigrationVersion)).resolves.toEqual({
        migrations: [
          {
            namespaces: [
              {
                namespace: DataNamespace.Appearance,
                namespaceTitle: 'data_namespace_appearance',
                steps: ['transfer tokens'],
              },
              {
                namespace: DataNamespace.Template,
                namespaceTitle: 'data_namespace_template',
                steps: ['transfer templates', 'remove legacy templates'],
              },
            ],
            version: legacyMigrationVersion,
          },
        ],
        version: legacyMigrationVersion,
      });
    });

    it('passes each required version as the old version, alongside the current version, to the migrators', async () => {
      const getRequiredMigrationSteps = vi.fn(async () => ['step']);
      const migrator = createMigrator(DataNamespace.Template, undefined, getRequiredMigrationSteps);
      const { manager } = createManager([migrator]);

      await manager.getRequiredMigrations(legacyMigrationVersion);

      expect(getRequiredMigrationSteps).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ newVersion: CURRENT_VERSION, oldVersion: legacyMigrationVersion }),
      );
    });

    // The UI renders this as "here is what is about to happen", so a namespace with nothing to do would be noise
    it('omits namespaces with no required steps', async () => {
      const logging = createMigrator(
        DataNamespace.Logging,
        undefined,
        vi.fn(async () => []),
      );
      const template = createMigrator(
        DataNamespace.Template,
        undefined,
        vi.fn(async () => ['transfer templates']),
      );
      const { manager } = createManager([logging, template]);

      await expect(manager.getRequiredMigrations(legacyMigrationVersion)).resolves.toEqual({
        migrations: [
          {
            namespaces: [
              {
                namespace: DataNamespace.Template,
                namespaceTitle: 'data_namespace_template',
                steps: ['transfer templates'],
              },
            ],
            version: legacyMigrationVersion,
          },
        ],
        version: legacyMigrationVersion,
      });
    });

    // A version can be required while none of its steps are - the legacy data may already have been cleared by
    // hand - and previewing an upgrade with nothing in it reads as though data is about to be migrated
    it('rejects with MIG409000 when every version is left with no namespaces', async () => {
      const migrator = createMigrator(
        DataNamespace.Logging,
        undefined,
        vi.fn(async () => []),
      );
      const { manager } = createManager([migrator]);

      await expect(manager.getRequiredMigrations(legacyMigrationVersion)).rejects.toMatchObject({
        code: 'MIG409000',
      });
    });

    // MIG409000 is thrown after the try block, so it must not be reported as a failure to determine what is required
    it('does not log a failure when there is simply nothing to migrate', async () => {
      const migrator = createMigrator(
        DataNamespace.Logging,
        undefined,
        vi.fn(async () => []),
      );
      const { logging, manager } = createManager([migrator]);

      await expect(manager.getRequiredMigrations(legacyMigrationVersion)).rejects.toThrow();

      expect(logging.logger.error).not.toHaveBeenCalled();
    });

    // Unlike `migrate()`, nothing is written here, so a migrator that cannot even determine its steps is reported
    // rather than silently dropped from the preview
    it('wraps a migrator failure as MIG500000, preserving the cause', async () => {
      const cause = new Error('boom');
      const migrator = createMigrator(
        DataNamespace.Template,
        undefined,
        vi.fn(async () => {
          throw cause;
        }),
      );
      const { manager } = createManager([migrator]);

      await expect(manager.getRequiredMigrations(legacyMigrationVersion)).rejects.toMatchObject({
        cause,
        code: 'MIG500000',
      });
    });

    it('rejects asynchronously with MIG409000 when no migration is required', async () => {
      const { manager } = createManager([createMigrator(DataNamespace.Template)], {
        versions: [{ phase: MigrationPhase.Completed, version: legacyMigrationVersion }],
      });
      let promise!: Promise<unknown>;

      expect(() => {
        promise = manager.getRequiredMigrations(legacyMigrationVersion);
      }).not.toThrow();

      await expect(promise).rejects.toMatchObject({ code: 'MIG409000' });
    });

    // Determining what will happen must not advance the migration phase or otherwise touch stored data
    it('does not migrate anything', async () => {
      const migrate = vi.fn(async () => []);
      const migrator = createMigrator(
        DataNamespace.Template,
        migrate,
        vi.fn(async () => ['step']),
      );
      const { manager, storage } = createManager([migrator]);

      await manager.getRequiredMigrations(legacyMigrationVersion);

      expect(migrate).not.toHaveBeenCalled();
      expect(storage.snapshot()).toEqual({ [DataNamespace.Migration]: { versions: [] } });
    });

    it('reads and converts the version query param when no version is supplied', async () => {
      const migrator = createMigrator(
        DataNamespace.Template,
        undefined,
        vi.fn(async () => ['step']),
      );
      const { extensionInfo, manager } = createManager([migrator]);
      vi.stubGlobal('document', {
        documentURI: 'chrome-extension://abc/migrate.html?version=1.2.9',
      });

      await expect(manager.getRequiredMigrations()).resolves.toMatchObject({ version: legacyMigrationVersion });

      expect(extensionInfo.convertStringToExtensionVersion).toHaveBeenCalledWith('1.2.9');
    });

    it('rejects asynchronously with MIG404000 when the version query param is absent', async () => {
      const { manager } = createManager([]);
      vi.stubGlobal('document', {
        documentURI: 'chrome-extension://abc/migrate.html',
      });
      let promise!: Promise<unknown>;

      expect(() => {
        promise = manager.getRequiredMigrations();
      }).not.toThrow();

      await expect(promise).rejects.toMatchObject({ code: 'MIG404000' });
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

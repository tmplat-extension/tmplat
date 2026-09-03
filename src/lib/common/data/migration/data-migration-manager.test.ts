import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
import { DataMigrationManager } from 'extension/common/data/migration/data-migration-manager';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { type DataMigrationStepResult } from 'extension/common/data/migration/data-migration.model';
import { DataMigrationService } from 'extension/common/data/migration/data-migration.service';
import { type DataMigrator } from 'extension/common/data/migration/data-migrator';
import { MigrationDataRepository } from 'extension/common/data/migration/migration-data.repository';
import { type MigrationData } from 'extension/common/data/migration/migration-data.schema';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { type TabService } from 'extension/tab/tab.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const LEGACY_VERSION = '1.2.9' as ExtensionVersion;
const CURRENT_VERSION = '2.0.0' as ExtensionVersion;

const passedStep = (description = 'passed step'): DataMigrationStepResult => ({
  description,
  outcome: DataMigrationOutcome.Passed,
});
const failedStep = (description = 'failed step'): DataMigrationStepResult => ({
  description,
  outcome: DataMigrationOutcome.Failed,
  reason: 'step failed',
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
  const repository = new MigrationDataRepository(
    { sync: storage } as unknown as DataService,
    logging as unknown as LoggingService,
    new ValidationService(logging as unknown as LoggingService),
  );
  const service = new DataMigrationService(logging as unknown as LoggingService, repository, {
    createExtensionTab: vi.fn(async () => undefined),
  } as unknown as TabService);
  const extensionInfo = {
    convertStringToExtensionVersion: vi.fn((version: string) => version as ExtensionVersion),
    getVersion: vi.fn(() => CURRENT_VERSION),
  } as unknown as ExtensionInfo;
  const legacyDataService = {
    local: new FakeDataStorage(),
    session: new FakeDataStorage(),
  } as unknown as LegacyDataService;
  const intl = createIntlServiceMock();
  const manager = new DataMigrationManager(
    service,
    extensionInfo,
    asIntlService(intl),
    legacyDataService,
    logging as unknown as LoggingService,
    migrators,
  );

  return { extensionInfo, intl, legacyDataService, logging, manager, storage };
};

describe('DataMigrationManager', () => {
  it('exposes the configured migrator namespaces in order', () => {
    const migrators = [createMigrator(DataNamespace.Template), createMigrator(DataNamespace.OAuth)];
    const { manager } = createManager(migrators);

    expect(manager.namespaces).toEqual([DataNamespace.Template, DataNamespace.OAuth]);
  });

  it('rejects asynchronously with MIG409000 when migration is not required', async () => {
    const { manager } = createManager([], {
      versions: [{ phase: MigrationPhase.Completed, version: LEGACY_VERSION }],
    });
    let promise!: Promise<unknown>;

    expect(() => {
      promise = manager.migrate(LEGACY_VERSION);
    }).not.toThrow();

    await expect(promise).rejects.toMatchObject({ code: 'MIG409000' });
  });

  it('maps passed, failed, skipped and throwing migrators and completes the migration', async () => {
    const passing = createMigrator(
      DataNamespace.Template,
      vi.fn(async () => [passedStep()]),
    );
    const failing = createMigrator(
      DataNamespace.OAuth,
      vi.fn(async () => [passedStep('ok'), failedStep()]),
    );
    const skipped = createMigrator(
      DataNamespace.Logging,
      vi.fn(async () => []),
    );
    const throwing = createMigrator(
      DataNamespace.Notification,
      vi.fn(async () => {
        throw new Error('boom');
      }),
    );
    const { manager, storage } = createManager([passing, failing, skipped, throwing]);

    await expect(manager.migrate(LEGACY_VERSION)).resolves.toEqual({
      results: [
        { namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Passed, steps: [passedStep()] },
        {
          namespace: DataNamespace.OAuth,
          outcome: DataMigrationOutcome.Failed,
          reason: 'data_migration_failed_reason',
          steps: [passedStep('ok'), failedStep()],
        },
        {
          namespace: DataNamespace.Logging,
          outcome: DataMigrationOutcome.Skipped,
          reason: 'data_migration_skipped_reason',
          steps: [],
        },
        {
          namespace: DataNamespace.Notification,
          outcome: DataMigrationOutcome.Failed,
          reason: expect.stringContaining('mig500000'),
          steps: [],
        },
      ],
      version: LEGACY_VERSION,
    });
    expect(storage.snapshot()).toEqual({
      [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: LEGACY_VERSION }] },
    });
  });

  it('passes the expected migration context to each migrator', async () => {
    const migrate = vi.fn(async () => [passedStep()]);
    const migrator = createMigrator(DataNamespace.Analytics, migrate);
    const { legacyDataService, manager } = createManager([migrator]);

    await manager.migrate(LEGACY_VERSION);

    expect(migrate).toHaveBeenCalledWith({
      legacyDataService,
      newVersion: CURRENT_VERSION,
      oldVersion: LEGACY_VERSION,
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
      versions: [{ phase: MigrationPhase.Started, version: LEGACY_VERSION }],
    });

    await expect(manager.migrate(LEGACY_VERSION)).resolves.toEqual({
      results: [
        { namespace: DataNamespace.Template, outcome: DataMigrationOutcome.Unknown, steps: [] },
        { namespace: DataNamespace.OAuth, outcome: DataMigrationOutcome.Unknown, steps: [] },
      ],
      version: LEGACY_VERSION,
    });
    expect(first.migrate).not.toHaveBeenCalled();
    expect(second.migrate).not.toHaveBeenCalled();
    expect(storage.snapshot()).toEqual({
      [DataNamespace.Migration]: { versions: [{ phase: MigrationPhase.Completed, version: LEGACY_VERSION }] },
    });
  });

  it('reads and converts the version query param when no version is supplied', async () => {
    const migrator = createMigrator(DataNamespace.Template);
    const { extensionInfo, manager } = createManager([migrator]);
    vi.stubGlobal('document', {
      documentURI: 'chrome-extension://abc/migrate.html?version=1.2.9',
    });

    await expect(manager.migrate()).resolves.toMatchObject({ version: LEGACY_VERSION });

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

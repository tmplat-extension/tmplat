import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { LoggingDataMigrator } from 'extension/common/logging/data/logging-data-migrator';
import { LoggingDataRepository } from 'extension/common/logging/data/logging-data.repository';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createMigrationContext, nonMigrationVersion } from 'extension/test/migration.fake';

const SEED: LoggingData = {
  enabled: true,
  level: LogLevel.Trace,
};

const createMigrator = () => {
  const target = new FakeDataStorage({ [DataNamespace.Logging]: structuredClone(SEED) });
  const repository = new LoggingDataRepository(
    { sync: target } as unknown as DataService,
    new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
  );
  const migrator = new LoggingDataMigrator(
    asIntlService(createIntlServiceMock()),
    createLoggingServiceMock() as unknown as LoggingService,
    repository,
  );

  return { migrator, target };
};

const getTargetData = (target: FakeDataStorage): LoggingData => target.snapshot()[DataNamespace.Logging] as LoggingData;

describe('LoggingDataMigrator', () => {
  it('reports the logging namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.Logging);
    expect(migrator.namespaceTitle).toBe('data_namespace_logging');
  });

  describe('isMigrationRequired', () => {
    it('is required when upgrading from 1.2.9 with legacy logging data present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ logger: { enabled: false } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ logger: { enabled: false } }, { oldVersion: nonMigrationVersion });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when legacy logging data is absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({});

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step description when legacy logging data is present', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({ logger: {} });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_logging_migration_step_1',
    ]);
  });

  describe('migrate', () => {
    it('transfers legacy logging options, swaps legacy debug/info levels, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ logger: { enabled: false, level: LogLevel.Debug } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_logging_migration_step_1', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual({ enabled: false, level: LogLevel.Info });
      await expect(local.has('logger')).resolves.toBe(false);
    });

    it('swaps legacy info to debug and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ logger: { level: LogLevel.Info } });

      await migrator.migrate(context);

      expect(getTargetData(target).level).toBe(LogLevel.Debug);
      await expect(local.has('logger')).resolves.toBe(false);
    });

    it('preserves other valid legacy log levels and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ logger: { level: LogLevel.Error } });

      await migrator.migrate(context);

      expect(getTargetData(target).level).toBe(LogLevel.Error);
      await expect(local.has('logger')).resolves.toBe(false);
    });

    it('ignores garbage legacy logging data, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ logger: { enabled: 'yes', level: 999 } });

      await migrator.migrate(context);

      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('logger')).resolves.toBe(false);
    });
  });
});

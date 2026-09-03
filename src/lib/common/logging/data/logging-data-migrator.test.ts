import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
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
      const { context } = createMigrationContext({ legacyData: { local: { logger: { enabled: false } } } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { logger: { enabled: false } } },
        oldVersion: nonMigrationVersion,
      });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when legacy logging data is absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext();

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step description when legacy logging data is present', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({ legacyData: { local: { logger: {} } } });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_logging_migration_step_1',
    ]);
  });

  describe('migrate', () => {
    it('swaps legacy debug/info levels, deliberately ignores legacy enabled, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: { local: { logger: { enabled: false, level: LogLevel.Debug } } },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_logging_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
      ]);
      // `enabled` was false by default in 1.x and is true by default now, so the legacy value is intentionally dropped
      expect(getTargetData(target)).toEqual({ enabled: SEED.enabled, level: LogLevel.Info });
      await expect(local.has('logger')).resolves.toBe(false);
    });

    it('swaps legacy info to debug and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { logger: { level: LogLevel.Info } } } });

      await migrator.migrate(context);

      expect(getTargetData(target).level).toBe(LogLevel.Debug);
      await expect(local.has('logger')).resolves.toBe(false);
    });

    it('preserves other valid legacy log levels and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { logger: { level: LogLevel.Error } } } });

      await migrator.migrate(context);

      expect(getTargetData(target).level).toBe(LogLevel.Error);
      await expect(local.has('logger')).resolves.toBe(false);
    });

    // 1.x persisted the log level from a `<select>` via jQuery `.val()` (`options.coffee:159-160`), which returns the
    // option's value ATTRIBUTE — a string — so every user who ever changed the level carries `'20'`, not `20`. The
    // schema now coerces numeric strings; without that, the step failed MIG422000 forever (a retry re-reads the same
    // data), so this is a regression guard, not a characterisation test.
    it('coerces a legacy log level persisted as a numeric string', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { logger: { enabled: true, level: '50' } } } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_logging_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
      ]);
      expect(getTargetData(target).level).toBe(LogLevel.Error);
      await expect(local.has('logger')).resolves.toBe(false);
    });

    it('applies the 1.x info/debug swap to a level persisted as a numeric string', async () => {
      const { migrator, target } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { logger: { level: '30' } } } });

      await migrator.migrate(context);

      expect(getTargetData(target).level).toBe(LogLevel.Debug);
    });

    it('fails with MIG422000 and retains the legacy key when the legacy logging data is garbage', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { logger: { enabled: 'yes', level: 999 } } } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        {
          description: 'data_namespace_logging_migration_step_1',
          errors: [expect.objectContaining({ code: 'MIG422000' })],
          outcome: DataMigrationStepOutcome.Failed,
        },
      ]);
      // Nothing written and nothing destroyed, so the migration stays retryable
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('logger')).resolves.toBe(true);
    });

    // The coercion is deliberately narrow (`/^\d+$/`), so a string that is not a whole number is still rejected
    // rather than silently becoming NaN or being dropped
    it.each([['not-a-level'], ['50.5'], ['-50'], ['']])(
      'fails with MIG422000 when the legacy log level is the non-numeric string %j',
      async (level) => {
        const { migrator, target } = createMigrator();
        const {
          context,
          legacyData: { local },
        } = createMigrationContext({ legacyData: { local: { logger: { level } } } });

        const results = await migrator.migrate(context);

        expect(results[0]).toMatchObject({
          errors: [expect.objectContaining({ code: 'MIG422000' })],
          outcome: DataMigrationStepOutcome.Failed,
        });
        expect(getTargetData(target)).toEqual(SEED);
        await expect(local.has('logger')).resolves.toBe(true);
      },
    );

    // Pre-1.2.3 stored `Enabled`/`Level`; the legacy 1.2.3 updater deleted them, but a user jumping straight from
    // <1.2.3 to 2.0.0 never ran it. `z.object` strips the unknown keys, so the step passes and the level simply falls
    // back to the default rather than failing the migration
    it('ignores pre-1.2.3 capitalised legacy keys rather than failing', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { logger: { Enabled: true, Level: '20' } } } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_logging_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('logger')).resolves.toBe(false);
    });
  });
});

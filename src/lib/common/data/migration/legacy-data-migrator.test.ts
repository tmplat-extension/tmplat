import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { LegacyDataMigrator } from 'extension/common/data/migration/legacy-data-migrator';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import {
  createMigrationContext,
  createNotRequiredStepResult,
  nonMigrationVersion,
} from 'extension/test/migration.fake';

/** The keys the single removal step is responsible for discarding. */
const legacyKeys = ['analytics', 'options_active_tab', 'options_limit', 'stats', 'updates'];

const createMigrator = () => {
  const intl = createIntlServiceMock();
  const logging = createLoggingServiceMock();
  const migrator = new LegacyDataMigrator(asIntlService(intl), logging as unknown as LoggingService);

  return { intl, logging, migrator };
};

describe('LegacyDataMigrator', () => {
  it('reports the legacy namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.Legacy);
    expect(migrator.namespaceTitle).toBe('migrate_namespace_legacy');
  });

  describe('isMigrationRequired', () => {
    it.each(legacyKeys)('is required when only the %s key is present', async (key) => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { [key]: 'value' } } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required when none of the legacy keys are present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { unrelated: 'value' } } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when upgrading from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { stats: {} } },
        oldVersion: nonMigrationVersion,
      });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when the legacy store is completely empty', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext();

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  describe('getRequiredMigrationSteps', () => {
    it('describes the removal step when legacy keys are present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { stats: {} } } });

      await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
        'migrate_namespace_legacy_migration_step_1',
      ]);
    });

    it('describes no steps when there is nothing to remove', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext();

      await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([]);
    });
  });

  describe('migrate', () => {
    it('removes every legacy key it owns', async () => {
      const { migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            analytics: true,
            options_active_tab: 'templates',
            options_limit: 10,
            stats: { copies: 3 },
            updates: { lastChecked: 1 },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'migrate_namespace_legacy_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
      ]);
      expect(local.snapshot()).toEqual({});
    });

    /*
     * `analytics` is discarded here rather than transferred, because 2.0 removed analytics entirely: there is no
     * namespace, repository or setting left for it to migrate into. It still has to be *removed* though — nothing
     * reads the key again, so leaving it would orphan it in the legacy storage forever.
     */
    it('discards the legacy analytics opt-in rather than transferring it', async () => {
      const { migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { analytics: true } } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'migrate_namespace_legacy_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
      ]);
      expect(local.snapshot()).toEqual({});
    });

    it('leaves keys owned by other migrators untouched', async () => {
      const { migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            links: { title: true },
            stats: { copies: 3 },
            templates: [],
          },
        },
      });

      await migrator.migrate(context);

      // This migrator must only discard its own obsolete keys; `links`/`templates` are transferred later by the
      // template migrator, so removing them here would destroy the user's data before it could be migrated
      expect(local.snapshot()).toEqual({ links: { title: true }, templates: [] });
    });

    it('removes the present subset without failing on absent keys', async () => {
      const { migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { updates: { lastChecked: 1 } } } });

      const results = await migrator.migrate(context);

      expect(results[0]?.outcome).toBe(DataMigrationStepOutcome.Passed);
      expect(local.snapshot()).toEqual({});
    });

    it('does nothing when the step is not required', async () => {
      const { migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { links: { title: true } } } });

      await expect(migrator.migrate(context)).resolves.toEqual([
        createNotRequiredStepResult('migrate_namespace_legacy_migration_step_1'),
      ]);
      expect(local.snapshot()).toEqual({ links: { title: true } });
    });

    it('does not throw synchronously', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { stats: {} } } });

      // Guards the sync-throw defect class found repeatedly in this codebase: a method typed `: Promise<T>` but
      // not declared `async` throws past a caller's `.catch()`. The promise is captured from a single invocation
      // and awaited, so this cannot leak an unhandled rejection into the run
      let promise: Promise<unknown> | undefined;
      expect(() => {
        promise = migrator.migrate(context);
      }).not.toThrow();

      await expect(promise).resolves.toBeDefined();
    });
  });
});

import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { LegacyDataMigrator } from 'extension/common/data/migration/legacy-data-migrator';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createMigrationContext, nonMigrationVersion } from 'extension/test/migration.fake';

/** The keys the single removal step is responsible for discarding. */
const legacyKeys = ['options_active_tab', 'options_limit', 'stats', 'updates'];

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
    expect(migrator.namespaceTitle).toBe('data_namespace_legacy');
  });

  describe('isMigrationRequired', () => {
    it.each(legacyKeys)('is required when only the %s key is present', async (key) => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ [key]: 'anything' });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required when none of the legacy keys are present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ unrelated: 'value' });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when upgrading from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ stats: {} }, { oldVersion: nonMigrationVersion });

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
      const { context } = createMigrationContext({ stats: {} });

      await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
        'data_namespace_legacy_migration_step_1',
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
      const { context, local } = createMigrationContext({
        options_active_tab: 'templates',
        options_limit: 10,
        stats: { copies: 3 },
        updates: { lastChecked: 1 },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_legacy_migration_step_1', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(local.snapshot()).toEqual({});
    });

    it('leaves keys owned by other migrators untouched', async () => {
      const { migrator } = createMigrator();
      const { context, local } = createMigrationContext({
        links: { title: true },
        stats: { copies: 3 },
        templates: [],
      });

      await migrator.migrate(context);

      // This migrator must only discard its own obsolete keys; `links`/`templates` are transferred later by the
      // template migrator, so removing them here would destroy the user's data before it could be migrated
      expect(local.snapshot()).toEqual({ links: { title: true }, templates: [] });
    });

    it('removes the present subset without failing on absent keys', async () => {
      const { migrator } = createMigrator();
      const { context, local } = createMigrationContext({ updates: { lastChecked: 1 } });

      const results = await migrator.migrate(context);

      expect(results[0]?.outcome).toBe(DataMigrationOutcome.Passed);
      expect(local.snapshot()).toEqual({});
    });

    it('does nothing when the step is not required', async () => {
      const { migrator } = createMigrator();
      const { context, local } = createMigrationContext({ links: { title: true } });

      await expect(migrator.migrate(context)).resolves.toEqual([]);
      expect(local.snapshot()).toEqual({ links: { title: true } });
    });

    it('does not throw synchronously', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ stats: {} });

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

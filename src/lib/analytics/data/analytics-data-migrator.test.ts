import { describe, expect, it } from 'vitest';
import { AnalyticsDataMigrator } from 'extension/analytics/data/analytics-data-migrator';
import { AnalyticsDataRepository } from 'extension/analytics/data/analytics-data.repository';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { type DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlService } from 'extension/common/intl/intl.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { nonMigrationVersion } from 'extension/test/migration.fake';

const SEED = { clientId: '11111111-1111-4111-8111-111111111111', enabled: false };

const createMigrator = () => {
  const target = new FakeDataStorage({ [DataNamespace.Analytics]: { ...SEED } });
  const repository = new AnalyticsDataRepository(
    { sync: target } as unknown as DataService,
    createLoggingServiceMock() as unknown as LoggingService,
    new ValidationService(createLoggingServiceMock() as never),
  );
  const intl = { getMessage: (key: string) => key } as unknown as IntlService;
  const migrator = new AnalyticsDataMigrator(intl, createLoggingServiceMock() as unknown as LoggingService, repository);

  return { migrator, target };
};

const context = (legacy: Record<string, unknown>, oldVersion = '1.2.9'): DataMigrationContext => ({
  legacyDataService: { local: new FakeDataStorage(legacy) } as unknown as LegacyDataService,
  newVersion: '2.0.0' as ExtensionVersion,
  oldVersion: oldVersion as ExtensionVersion,
});

describe('AnalyticsDataMigrator', () => {
  it('reports the analytics namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.Analytics);
    expect(migrator.namespaceTitle).toBe('data_namespace_analytics');
  });

  describe('isMigrationRequired', () => {
    it('is required when upgrading from 1.2.9 with a legacy analytics flag present', async () => {
      const { migrator } = createMigrator();

      await expect(migrator.isMigrationRequired(context({ analytics: true }))).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();

      await expect(migrator.isMigrationRequired(context({ analytics: true }, nonMigrationVersion))).resolves.toBe(
        false,
      );
    });

    it('is not required when the legacy analytics flag is absent', async () => {
      const { migrator } = createMigrator();

      await expect(migrator.isMigrationRequired(context({}))).resolves.toBe(false);
    });
  });

  describe('migrate', () => {
    it('transfers the legacy boolean into the analytics enabled flag and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const ctx = context({ analytics: true });

      const results = await migrator.migrate(ctx);

      expect(results).toEqual([
        { description: 'data_namespace_analytics_migration_step_1', outcome: DataMigrationOutcome.Passed },
      ]);
      expect((target.snapshot()[DataNamespace.Analytics] as { enabled: boolean }).enabled).toBe(true);
      await expect(ctx.legacyDataService.local.has('analytics')).resolves.toBe(false);
    });

    it('ignores a non-boolean legacy value, leaving the enabled flag unchanged', async () => {
      const { migrator, target } = createMigrator();

      await migrator.migrate(context({ analytics: 'nope' }));

      expect((target.snapshot()[DataNamespace.Analytics] as { enabled: boolean }).enabled).toBe(false);
    });
  });
});

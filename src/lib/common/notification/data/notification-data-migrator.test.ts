import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { NotificationDataMigrator } from 'extension/common/notification/data/notification-data-migrator';
import { NotificationDataRepository } from 'extension/common/notification/data/notification-data.repository';
import { type NotificationData } from 'extension/common/notification/data/notification-data.schema';
import { ValidationService } from 'extension/common/validation/validation.service';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createMigrationContext, nonMigrationVersion } from 'extension/test/migration.fake';

const SEED: NotificationData = {
  changelog: {
    enabled: true,
    scope: VersionSegment.Minor,
  },
  enabled: true,
};

const createMigrator = () => {
  const target = new FakeDataStorage({ [DataNamespace.Notification]: structuredClone(SEED) });
  const repository = new NotificationDataRepository(
    { sync: target } as unknown as DataService,
    createLoggingServiceMock() as unknown as LoggingService,
    new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
  );
  const migrator = new NotificationDataMigrator(
    asIntlService(createIntlServiceMock()),
    createLoggingServiceMock() as unknown as LoggingService,
    repository,
  );

  return { migrator, target };
};

const getTargetData = (target: FakeDataStorage): NotificationData =>
  target.snapshot()[DataNamespace.Notification] as NotificationData;

describe('NotificationDataMigrator', () => {
  it('reports the notification namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.Notification);
    expect(migrator.namespaceTitle).toBe('data_namespace_notification');
  });

  describe('isMigrationRequired', () => {
    it('is required when upgrading from 1.2.9 with legacy notification data present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ notifications: { enabled: false } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext(
        { notifications: { enabled: false } },
        { oldVersion: nonMigrationVersion },
      );

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when legacy notification data is absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({});

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step description when legacy notification data is present', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({ notifications: {} });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_notification_migration_step_1',
    ]);
  });

  describe('migrate', () => {
    it('transfers the legacy notification flag and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ notifications: { enabled: false } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_notification_migration_step_1', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual({ ...SEED, enabled: false });
      await expect(local.has('notifications')).resolves.toBe(false);
    });

    it('ignores garbage legacy notification data, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ notifications: { enabled: 'no' } });

      await migrator.migrate(context);

      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('notifications')).resolves.toBe(false);
    });
  });
});

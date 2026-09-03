import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { OAuthDataMigrator } from 'extension/oauth/data/oauth-data-migrator';
import { OAuthDataRepository } from 'extension/oauth/data/oauth-data.repository';
import { type OAuthData } from 'extension/oauth/data/oauth-data.schema';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createMigrationContext, nonMigrationVersion } from 'extension/test/migration.fake';

const SEED: OAuthData = {
  providers: {
    bitly: {
      accessToken: null,
      principal: null,
    },
  },
};

const createMigrator = () => {
  const target = new FakeDataStorage({ [DataNamespace.OAuth]: structuredClone(SEED) });
  const repository = new OAuthDataRepository(
    { local: target } as unknown as DataService,
    createLoggingServiceMock() as unknown as LoggingService,
    new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
  );
  const migrator = new OAuthDataMigrator(
    asIntlService(createIntlServiceMock()),
    createLoggingServiceMock() as unknown as LoggingService,
    repository,
  );

  return { migrator, target };
};

const getTargetData = (target: FakeDataStorage): OAuthData => target.snapshot()[DataNamespace.OAuth] as OAuthData;

describe('OAuthDataMigrator', () => {
  it('reports the oauth namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.OAuth);
    expect(migrator.namespaceTitle).toBe('data_namespace_oauth');
  });

  describe('isMigrationRequired', () => {
    it('is required when upgrading from 1.2.9 with a legacy oauth key present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ oauth2_bitly: { accessToken: 'token' } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext(
        { oauth2_bitly: { accessToken: 'token' } },
        { oldVersion: nonMigrationVersion },
      );

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when legacy oauth keys are absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({});

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step descriptions for present transfer and removal keys', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({ oauth2_adapterReverse: true, oauth2_bitly: {}, oauth2_google: true });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_oauth_migration_step_1',
      'data_namespace_oauth_migration_step_2',
    ]);
  });

  describe('migrate', () => {
    it('transfers legacy Bitly OAuth data and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ oauth2_bitly: { accessToken: 'token', login: 'user' } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_oauth_migration_step_1', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target).providers.bitly).toEqual({ accessToken: 'token', principal: 'user' });
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    it('converts blank legacy Bitly OAuth strings to null and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ oauth2_bitly: { accessToken: '', login: 'user' } });

      await migrator.migrate(context);

      expect(getTargetData(target).providers.bitly).toEqual({ accessToken: null, principal: null });
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    it('ignores garbage legacy Bitly OAuth data, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ oauth2_bitly: { accessToken: 123, login: true } });

      await migrator.migrate(context);

      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    it('removes obsolete OAuth provider keys', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ oauth2_adapterReverse: { token: 'a' }, oauth2_google: {} });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_oauth_migration_step_2', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.hasAny(['oauth2_adapterReverse', 'oauth2_google'])).resolves.toBe(false);
    });
  });
});

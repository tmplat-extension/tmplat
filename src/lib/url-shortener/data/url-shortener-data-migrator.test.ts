import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createMigrationContext, nonMigrationVersion } from 'extension/test/migration.fake';
import { UrlShortenerDataMigrator } from 'extension/url-shortener/data/url-shortener-data-migrator';
import { UrlShortenerDataRepository } from 'extension/url-shortener/data/url-shortener-data.repository';
import { type UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

const SEED: UrlShortenerData = {
  provider: UrlShortenerProviderName.SpooMe,
  providers: {
    [UrlShortenerProviderName.Bitly]: {},
    [UrlShortenerProviderName.DaGd]: {},
    [UrlShortenerProviderName.SpooMe]: {},
    [UrlShortenerProviderName.Yourls]: {
      authenticationMode: null,
      password: null,
      signature: null,
      url: null,
      username: null,
    },
  },
};

const createMigrator = () => {
  const target = new FakeDataStorage({ [DataNamespace.UrlShortener]: structuredClone(SEED) });
  const repository = new UrlShortenerDataRepository(
    { local: target } as unknown as DataService,
    createLoggingServiceMock() as unknown as LoggingService,
    new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
  );
  const migrator = new UrlShortenerDataMigrator(
    asIntlService(createIntlServiceMock()),
    createLoggingServiceMock() as unknown as LoggingService,
    repository,
  );

  return { migrator, target };
};

const getTargetData = (target: FakeDataStorage): UrlShortenerData =>
  target.snapshot()[DataNamespace.UrlShortener] as UrlShortenerData;

describe('UrlShortenerDataMigrator', () => {
  it('reports the URL shortener namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.UrlShortener);
    expect(migrator.namespaceTitle).toBe('data_namespace_url_shortener');
  });

  describe('isMigrationRequired', () => {
    it('is required when upgrading from 1.2.9 with a legacy URL shortener key present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ bitly: { enabled: true } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ bitly: { enabled: true } }, { oldVersion: nonMigrationVersion });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when legacy URL shortener keys are absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({});

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step descriptions for present transfer and removal keys', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({ bitly: {}, googl: {}, yourls: {} });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_url_shortener_migration_step_1',
      'data_namespace_url_shortener_migration_step_2',
      'data_namespace_url_shortener_migration_step_3',
    ]);
  });

  describe('migrate', () => {
    it('selects Bitly when legacy Bitly is enabled and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ bitly: { enabled: true } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_url_shortener_migration_step_1', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target).provider).toBe(UrlShortenerProviderName.Bitly);
      await expect(local.has('bitly')).resolves.toBe(false);
    });

    it('ignores disabled or garbage legacy Bitly data, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ bitly: { enabled: 'yes' } });

      await migrator.migrate(context);

      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('bitly')).resolves.toBe(false);
    });

    it('transfers legacy YOURLS settings, selects YOURLS when enabled, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        yourls: {
          authentication: YourlsAuthenticationMode.Basic,
          enabled: true,
          password: 'password',
          signature: 'signature',
          url: 'https://sho.rt/yourls-api.php',
          username: 'user',
        },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_url_shortener_migration_step_2', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual({
        ...SEED,
        provider: UrlShortenerProviderName.Yourls,
        providers: {
          ...SEED.providers,
          [UrlShortenerProviderName.Yourls]: {
            authenticationMode: YourlsAuthenticationMode.Basic,
            password: 'password',
            signature: 'signature',
            url: 'https://sho.rt/yourls-api.php',
            username: 'user',
          },
        },
      });
      await expect(local.has('yourls')).resolves.toBe(false);
    });

    it('converts blank legacy YOURLS strings to null and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        yourls: {
          authentication: YourlsAuthenticationMode.Advanced,
          password: '',
          signature: '',
          url: '',
          username: '',
        },
      });

      await migrator.migrate(context);

      expect(getTargetData(target).providers.yourls).toEqual({
        authenticationMode: YourlsAuthenticationMode.Advanced,
        password: null,
        signature: null,
        url: null,
        username: null,
      });
      await expect(local.has('yourls')).resolves.toBe(false);
    });

    it('ignores garbage legacy YOURLS data, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        yourls: { authentication: 'digest', enabled: false, password: 1, signature: true, url: [], username: {} },
      });

      await migrator.migrate(context);

      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('yourls')).resolves.toBe(false);
    });

    it('returns a failed step when legacy YOURLS data produces schema-invalid target data', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ yourls: { url: 'not-a-url' } });

      const results = await migrator.migrate(context);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        description: 'data_namespace_url_shortener_migration_step_2',
        outcome: DataMigrationOutcome.Failed,
      });
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('yourls')).resolves.toBe(true);
    });

    it('removes obsolete Google URL shortener data', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ googl: { apiKey: 'key' } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_url_shortener_migration_step_3', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('googl')).resolves.toBe(false);
    });
  });
});

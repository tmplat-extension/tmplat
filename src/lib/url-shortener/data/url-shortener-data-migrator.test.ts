import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { isHttpUrl } from 'extension/common/url.utils';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import {
  createMigrationContext,
  createNotRequiredStepResult,
  nonMigrationVersion,
} from 'extension/test/migration.fake';
import { LegacyUrlShortenerYourlsProviderDataSchema } from 'extension/url-shortener/data/legacy-url-shortener-data.schema';
import { UrlShortenerDataMigrator } from 'extension/url-shortener/data/url-shortener-data-migrator';
import { UrlShortenerDataRepository } from 'extension/url-shortener/data/url-shortener-data.repository';
import {
  type UrlShortenerData,
  UrlShortenerYourlsProviderConfigSchema,
} from 'extension/url-shortener/data/url-shortener-data.schema';
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
      const { context } = createMigrationContext({ legacyData: { local: { bitly: { enabled: true } } } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { bitly: { enabled: true } } },
        oldVersion: nonMigrationVersion,
      });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when legacy URL shortener keys are absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext();

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step descriptions for present transfer and removal keys', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({ legacyData: { local: { bitly: {}, googl: {}, yourls: {} } } });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_url_shortener_migration_step_1',
      'data_namespace_url_shortener_migration_step_2',
      'data_namespace_url_shortener_migration_step_3',
    ]);
  });

  describe('migrate', () => {
    it('discards legacy Bitly data without selecting Bitly, even when it was enabled', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { bitly: { enabled: true } } } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_url_shortener_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
        createNotRequiredStepResult('data_namespace_url_shortener_migration_step_2'),
        createNotRequiredStepResult('data_namespace_url_shortener_migration_step_3'),
      ]);
      // Bitly is no longer the preferred default, so the legacy preference is deliberately dropped
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('bitly')).resolves.toBe(false);
    });

    it('discards garbage legacy Bitly data, since the step only removes it', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { bitly: { enabled: 'yes' } } } });

      await migrator.migrate(context);

      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('bitly')).resolves.toBe(false);
    });

    it('transfers legacy YOURLS settings, selects YOURLS when enabled, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            yourls: {
              authentication: YourlsAuthenticationMode.Basic,
              enabled: true,
              password: 'password',
              signature: 'signature',
              url: 'https://sho.rt/yourls-api.php',
              username: 'user',
            },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        createNotRequiredStepResult('data_namespace_url_shortener_migration_step_1'),
        { description: 'data_namespace_url_shortener_migration_step_2', outcome: DataMigrationStepOutcome.Passed },
        createNotRequiredStepResult('data_namespace_url_shortener_migration_step_3'),
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

    // BUG E (FIXED) — regression guard. Legacy YOURLS data defaulted every string to ''
    // (background.coffee:1659-1666), and selecting authentication "None" in the options page explicitly persisted ''
    // (options.coffee:899-900). Blank strings previously satisfied neither `z.string().nonempty()`, `z.httpUrl()` nor
    // `z.enum(YourlsAuthenticationMode)`, so the untouched default shape that EVERY 1.x user who never configured
    // YOURLS carries failed validation — permanently, since a retry re-reads identical data. They now coerce to null.
    it('migrates the untouched legacy YOURLS defaults, coercing blank strings to null', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            // Exactly what background.coffee:1659-1666 writes for a user who never opened the YOURLS settings
            yourls: {
              authentication: '',
              enabled: false,
              password: '',
              signature: '',
              url: '',
              usage: 0,
              username: '',
            },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results[1]).toEqual({
        description: 'data_namespace_url_shortener_migration_step_2',
        outcome: DataMigrationStepOutcome.Passed,
      });
      expect(getTargetData(target).providers[UrlShortenerProviderName.Yourls]).toEqual({
        authenticationMode: null,
        password: null,
        signature: null,
        url: null,
        username: null,
      });
      // `enabled` was false, so the preferred provider must be left alone
      expect(getTargetData(target).provider).toBe(UrlShortenerProviderName.SpooMe);
      await expect(local.has('yourls')).resolves.toBe(false);
    });

    // BUG I (FIXED) — regression guard. `z.httpUrl()` is `z.url()` plus a hostname regex requiring a dot-separated
    // domain, so it rejected `localhost`, bare IPs and single-label intranet hostnames. YOURLS is SELF-HOSTED
    // software, so those are entirely normal configurations — and 1.x never validated the field at all
    // (options.coffee:903-906 persists `@val().trim()` on every `input` event, i.e. per keystroke, and the
    // `type="url"` attribute on `#yourlsUrl` does not gate that path). Both the legacy schema here and the modern
    // `UrlShortenerYourlsProviderConfigSchema` now use `z.url({ protocol: /^https?$/ })`.
    it.each([
      ['http://localhost/yourls-api.php'],
      ['http://localhost:8080/yourls-api.php'],
      ['http://192.168.1.5/yourls-api.php'],
      ['http://[::1]:8080/yourls-api.php'],
      ['http://yourls/yourls-api.php'],
    ])('migrates a self-hosted legacy YOURLS url %j', async (url) => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: { local: { yourls: { authentication: '', enabled: true, url, usage: 3 } } },
      });

      const results = await migrator.migrate(context);

      expect(results[1]).toEqual({
        description: 'data_namespace_url_shortener_migration_step_2',
        outcome: DataMigrationStepOutcome.Passed,
      });
      expect(getTargetData(target).providers[UrlShortenerProviderName.Yourls].url).toBe(url);
      expect(getTargetData(target).provider).toBe(UrlShortenerProviderName.Yourls);
      await expect(local.has('yourls')).resolves.toBe(false);
    });

    // The relaxation must not go too far: a protocol-less or non-HTTP url is still rejected
    it.each([['ftp://example.com/yourls-api.php'], ['example.com/yourls-api.php'], ['https:/'], ['h']])(
      'still fails an invalid legacy YOURLS url %j',
      async (url) => {
        const { migrator, target } = createMigrator();
        const {
          context,
          legacyData: { local },
        } = createMigrationContext({
          legacyData: { local: { yourls: { authentication: '', enabled: true, url, usage: 3 } } },
        });

        const results = await migrator.migrate(context);

        expect(results[1]).toMatchObject({
          errors: [expect.objectContaining({ code: 'MIG422000' })],
          outcome: DataMigrationStepOutcome.Failed,
        });
        expect(getTargetData(target)).toEqual(SEED);
        await expect(local.has('yourls')).resolves.toBe(true);
      },
    );

    // The options page gates the YOURLS url with `isHttpUrl` (url.utils), NOT with the schema, so the two must agree
    // or a user can enter a url the UI accepts and the repository write then rejects. Before BUG I was fixed they
    // diverged on exactly the self-hosted cases above: `isHttpUrl` accepted them, `z.httpUrl()` did not.
    it.each([
      ['https://s.example.com/yourls-api.php', true],
      ['http://localhost/yourls-api.php', true],
      ['http://localhost:8080/yourls-api.php', true],
      ['http://192.168.1.5/yourls-api.php', true],
      ['http://[::1]:8080/yourls-api.php', true],
      ['http://yourls/yourls-api.php', true],
      ['ftp://example.com/x', false],
      ['example.com/yourls-api.php', false],
      ['https:/', false],
      ['h', false],
    ])('agrees with the options page url validator for %j', (url, expected) => {
      expect(isHttpUrl(url)).toBe(expected);
      expect(LegacyUrlShortenerYourlsProviderDataSchema.safeParse({ url }).success).toBe(expected);
      expect(
        UrlShortenerYourlsProviderConfigSchema.safeParse({
          authenticationMode: null,
          password: null,
          signature: null,
          url,
          username: null,
        }).success,
      ).toBe(expected);
    });

    it('migrates a configured legacy YOURLS provider on a public host', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            yourls: {
              authentication: 'advanced',
              enabled: true,
              password: '',
              signature: 'sig-token',
              url: 'https://s.example.com/yourls-api.php',
              usage: 12,
              username: '',
            },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results[1]).toEqual({
        description: 'data_namespace_url_shortener_migration_step_2',
        outcome: DataMigrationStepOutcome.Passed,
      });
      expect(getTargetData(target).providers[UrlShortenerProviderName.Yourls]).toEqual({
        authenticationMode: YourlsAuthenticationMode.Advanced,
        password: null,
        signature: 'sig-token',
        url: 'https://s.example.com/yourls-api.php',
        username: null,
      });
      expect(getTargetData(target).provider).toBe(UrlShortenerProviderName.Yourls);
      await expect(local.has('yourls')).resolves.toBe(false);
    });

    it('fails with MIG422000 and retains the legacy key when the legacy YOURLS data is garbage', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            yourls: { authentication: 'digest', enabled: false, password: 1, signature: true, url: [], username: {} },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results[1]).toMatchObject({
        description: 'data_namespace_url_shortener_migration_step_2',
        errors: [expect.objectContaining({ code: 'MIG422000' })],
        outcome: DataMigrationStepOutcome.Failed,
      });
      // Nothing written and nothing destroyed, so the migration stays retryable
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('yourls')).resolves.toBe(true);
    });

    it('accepts explicit nulls for the optional legacy YOURLS strings', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            yourls: {
              authentication: YourlsAuthenticationMode.Advanced,
              password: null,
              signature: null,
              url: null,
              username: null,
            },
          },
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

    it('ignores legacy YOURLS keys that are absent, leaving the seeded values in place', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { yourls: { enabled: false } } } });

      await migrator.migrate(context);

      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('yourls')).resolves.toBe(false);
    });

    it('returns a failed step when the legacy YOURLS URL is not a URL', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { yourls: { url: 'not-a-url' } } } });

      const results = await migrator.migrate(context);

      expect(results).toHaveLength(3);
      expect(results[1]).toMatchObject({
        description: 'data_namespace_url_shortener_migration_step_2',
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('yourls')).resolves.toBe(true);
    });

    it('removes obsolete Google URL shortener data', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { googl: { apiKey: 'key' } } } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        createNotRequiredStepResult('data_namespace_url_shortener_migration_step_1'),
        createNotRequiredStepResult('data_namespace_url_shortener_migration_step_2'),
        { description: 'data_namespace_url_shortener_migration_step_3', outcome: DataMigrationStepOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('googl')).resolves.toBe(false);
    });
  });
});

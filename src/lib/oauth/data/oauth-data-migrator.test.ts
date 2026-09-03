import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { OAuthDataMigrator } from 'extension/oauth/data/oauth-data-migrator';
import { OAuthDataRepository } from 'extension/oauth/data/oauth-data.repository';
import { type OAuthData } from 'extension/oauth/data/oauth-data.schema';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import {
  createMigrationContext,
  createNotRequiredStepResult,
  nonMigrationVersion,
} from 'extension/test/migration.fake';

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
      const { context } = createMigrationContext({ legacyData: { local: { oauth2_bitly: { accessToken: 'token' } } } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { oauth2_bitly: { accessToken: 'token' } } },
        oldVersion: nonMigrationVersion,
      });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when legacy oauth keys are absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext();

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step descriptions for present transfer and removal keys', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({
      legacyData: { local: { oauth2_adapterReverse: true, oauth2_bitly: {}, oauth2_google: true } },
    });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_oauth_migration_step_1',
      'data_namespace_oauth_migration_step_2',
    ]);
  });

  describe('migrate', () => {
    it('transfers legacy Bitly OAuth data and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { oauth2_bitly: { accessToken: 'token', login: 'user' } } } });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_oauth_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
        createNotRequiredStepResult('data_namespace_oauth_migration_step_2'),
      ]);
      expect(getTargetData(target).providers.bitly).toEqual({ accessToken: 'token', principal: 'user' });
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    it('accepts explicit nulls and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { oauth2_bitly: { accessToken: null, login: null } } } });

      await migrator.migrate(context);

      expect(getTargetData(target).providers.bitly).toEqual({ accessToken: null, principal: null });
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    // `oauth2_bitly` was written by the now-deleted vendored `src/vendor/oauth2.js`, never by a form input, so its
    // reachable shapes are narrow. `finishAuth` persisted parsed fields via `if (data.hasOwnProperty(name) &&
    // data[name])` — a truthy guard — so a blank value from the bitly adapter's `([^&]*)` regexes was DROPPED rather
    // than stored. Blank strings are therefore unreachable here and `.nonempty()` is correct, unlike the YOURLS case.
    // The record also carries vendor bookkeeping (`accessTokenDate`, `apiKey`, `clientId`, `clientSecret`,
    // `expiresIn`) which the schema must strip.
    it('migrates the full legacy record written by the vendored OAuth2 library, stripping its bookkeeping', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            oauth2_bitly: {
              accessToken: 'token',
              accessTokenDate: 1_700_000_000_000,
              apiKey: 'R_apikey',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              expiresIn: Number.MAX_VALUE,
              login: 'user',
            },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results[0]).toEqual({
        description: 'data_namespace_oauth_migration_step_1',
        outcome: DataMigrationStepOutcome.Passed,
      });
      expect(getTargetData(target).providers.bitly).toEqual({ accessToken: 'token', principal: 'user' });
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    // `clear('accessToken')`/`clear('login')` DELETED the properties (`delete obj[name]`) rather than blanking them,
    // so a logged-out 1.x user is left with only the vendor bookkeeping. Both fields must migrate as absent, not fail.
    it('migrates a logged-out legacy record as having no token or principal', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            oauth2_bitly: {
              accessTokenDate: 1_700_000_000_000,
              clientId: 'client-id',
              clientSecret: 'client-secret',
              expiresIn: Number.MAX_VALUE,
            },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results[0]).toEqual({
        description: 'data_namespace_oauth_migration_step_1',
        outcome: DataMigrationStepOutcome.Passed,
      });
      expect(getTargetData(target).providers.bitly).toEqual({ accessToken: null, principal: null });
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    // FINDING (pinned, NOT fixed): the pre-schema mutator discarded `login` unless an access token was also present.
    // It is now transferred unconditionally, so a token-less legacy record yields a principal with no access token.
    // This shape IS reachable: `finishAuth` truthy-guarded each parsed field independently, so a response with a
    // blank `access_token=` but a populated `login=` persisted the login alone.
    it('transfers a legacy login even when no access token accompanies it', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { oauth2_bitly: { login: 'user' } } } });

      await migrator.migrate(context);

      expect(getTargetData(target).providers.bitly).toEqual({ accessToken: null, principal: 'user' });
      await expect(local.has('oauth2_bitly')).resolves.toBe(false);
    });

    it('fails with MIG422000 and retains the legacy key when the legacy Bitly OAuth data is garbage', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { oauth2_bitly: { accessToken: 123, login: true } } } });

      const results = await migrator.migrate(context);

      expect(results[0]).toMatchObject({
        description: 'data_namespace_oauth_migration_step_1',
        errors: [expect.objectContaining({ code: 'MIG422000' })],
        outcome: DataMigrationStepOutcome.Failed,
      });
      // Nothing written and nothing destroyed, so the migration stays retryable
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.has('oauth2_bitly')).resolves.toBe(true);
    });

    it('removes obsolete OAuth provider keys', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: { local: { oauth2_adapterReverse: { token: 'a' }, oauth2_google: {} } },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        createNotRequiredStepResult('data_namespace_oauth_migration_step_1'),
        { description: 'data_namespace_oauth_migration_step_2', outcome: DataMigrationStepOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual(SEED);
      await expect(local.hasAny(['oauth2_adapterReverse', 'oauth2_google'])).resolves.toBe(false);
    });
  });
});

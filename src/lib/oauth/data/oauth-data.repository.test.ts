import { beforeEach, describe, expect, it } from 'vitest';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { OAuthDataRepository } from 'extension/oauth/data/oauth-data.repository';
import { OAuthDataSchema } from 'extension/oauth/data/oauth-data.schema';
import { asDataService, FakeDataService } from 'extension/test/data-service.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const installContext = {} as DataInstallContext;

describe('OAuthDataRepository', () => {
  let dataService: FakeDataService;
  let repository: OAuthDataRepository;

  beforeEach(() => {
    dataService = new FakeDataService();
    repository = new OAuthDataRepository(
      asDataService(dataService),
      createLoggingServiceMock() as unknown as LoggingService,
      new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
    );
  });

  it('installs schema-valid default data on a fresh profile', async () => {
    const installed = await repository.install(installContext);

    expect(installed).toBe(true);
    const data = await repository.get();
    expect(data).toEqual({ providers: { bitly: { accessToken: null, principal: null } } });
    expect(OAuthDataSchema.safeParse(data).success).toBe(true);
  });

  it('stores credentials in local (device-only) storage, not sync', async () => {
    await repository.install(installContext);

    expect(await dataService.local.getOptional('oauth')).toBeDefined();
    expect(await dataService.sync.getOptional('oauth')).toBeUndefined();
  });

  it('does not overwrite existing data when installing again', async () => {
    await repository.install(installContext);
    await repository.mutate((data) => {
      data.providers.bitly = { accessToken: 'token', principal: 'user' };
      return data;
    });

    const installed = await repository.install(installContext);

    expect(installed).toBe(false);
    expect((await repository.get()).providers.bitly).toEqual({ accessToken: 'token', principal: 'user' });
  });
});

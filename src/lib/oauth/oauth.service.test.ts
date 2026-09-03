import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthService } from 'extension/oauth/oauth.service';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { type OAuthProvider } from 'extension/oauth/provider/oauth.provider';

const createProviderMock = (name: OAuthProviderName) => ({
  authenticate: vi.fn().mockResolvedValue({ accessToken: 'token', principal: 'user' }),
  getAuthentication: vi.fn().mockResolvedValue(null),
  isAuthenticated: vi.fn().mockResolvedValue(false),
  name,
  requestAuthentication: vi.fn().mockResolvedValue({ accessToken: 'token', principal: 'user' }),
  revokeAuthentication: vi.fn().mockResolvedValue(undefined),
});

describe('OAuthService', () => {
  let bitly: ReturnType<typeof createProviderMock>;
  let service: OAuthService;

  beforeEach(() => {
    bitly = createProviderMock(OAuthProviderName.Bitly);
    service = new OAuthService([bitly as unknown as OAuthProvider]);
  });

  it.each([
    ['authenticate', 'authenticate'],
    ['getAuthentication', 'getAuthentication'],
    ['isAuthenticated', 'isAuthenticated'],
    ['requestAuthentication', 'requestAuthentication'],
    ['revokeAuthentication', 'revokeAuthentication'],
  ] as const)('delegates %s to the named provider', async (_label, method) => {
    await service[method](OAuthProviderName.Bitly);

    expect(bitly[method]).toHaveBeenCalledTimes(1);
  });

  // Regression: every one of these methods delegates through the synchronous `getProvider`, which throws when the
  // provider is unregistered. Before they were declared `async` that throw escaped *synchronously*, bypassing a
  // caller written as `service.authenticate(...).catch(...)` — the normal way to handle a rejected promise.
  it.each([
    ['authenticate', 'authenticate'],
    ['getAuthentication', 'getAuthentication'],
    ['isAuthenticated', 'isAuthenticated'],
    ['requestAuthentication', 'requestAuthentication'],
    ['revokeAuthentication', 'revokeAuthentication'],
  ] as const)(
    'rejects from %s for an unregistered provider rather than throwing synchronously',
    async (_label, method) => {
      service = new OAuthService([]);
      let promise!: Promise<unknown>;

      expect(() => {
        promise = service[method](OAuthProviderName.Bitly);
      }).not.toThrow();
      await expect(promise).rejects.toThrow(`OAuth provider '${OAuthProviderName.Bitly}' not found`);
    },
  );
});

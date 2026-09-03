import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type OAuthDataRepository } from 'extension/oauth/data/oauth-data.repository';
import { type OAuthData } from 'extension/oauth/data/oauth-data.schema';
import { BitlyOAuthProvider } from 'extension/oauth/provider/bitly-oauth.provider';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { getRequestUrl, installFetchMock, jsonResponse, malformedJsonResponse } from 'extension/test/fetch.mock';

const AUTHORIZATION_CODE = 'auth-code';
const REDIRECT_URI = 'https://test-extension-id.chromiumapp.org/';

const createData = (accessToken: string | null = null, principal: string | null = null): OAuthData => ({
  providers: {
    [OAuthProviderName.Bitly]: { accessToken, principal },
  },
});

describe('BitlyOAuthProvider', () => {
  let data: OAuthData;
  let fetchMock: Mock<typeof fetch>;
  let provider: BitlyOAuthProvider;
  let repository: { get: Mock; set: Mock };

  beforeEach(() => {
    data = createData();
    fetchMock = installFetchMock();
    repository = {
      get: vi.fn(() => Promise.resolve(data)),
      set: vi.fn((updated: OAuthData) => {
        data = updated;
        return Promise.resolve();
      }),
    };
    provider = new BitlyOAuthProvider(repository as unknown as OAuthDataRepository);

    getBrowserApiMock().identity.launchWebAuthFlow.mockResolvedValue(`${REDIRECT_URI}?code=${AUTHORIZATION_CODE}`);
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'access-token', login: 'user' }));
  });

  it('is named after the Bitly provider', () => {
    expect(provider.name).toBe(OAuthProviderName.Bitly);
  });

  describe('getAuthentication', () => {
    it('resolves null while no access token is stored', async () => {
      await expect(provider.getAuthentication()).resolves.toBeNull();
    });

    it('resolves the stored authentication', async () => {
      data = createData('stored-token', 'stored-user');

      await expect(provider.getAuthentication()).resolves.toEqual({
        accessToken: 'stored-token',
        principal: 'stored-user',
      });
    });
  });

  describe('isAuthenticated', () => {
    it.each([
      ['no access token is stored', null, false],
      ['an access token is stored', 'stored-token', true],
    ])('resolves %s -> %s', async (_label, accessToken, expected) => {
      data = createData(accessToken);

      await expect(provider.isAuthenticated()).resolves.toBe(expected);
    });
  });

  describe('requestAuthentication', () => {
    it('launches the web auth flow against the Bitly authorization page', async () => {
      await provider.requestAuthentication();

      const { launchWebAuthFlow } = getBrowserApiMock().identity;

      expect(launchWebAuthFlow).toHaveBeenCalledTimes(1);

      const { interactive, url } = launchWebAuthFlow.mock.calls[0][0];

      expect(interactive).toBe(true);

      const authenticationUrl = new URL(url);

      expect(authenticationUrl.origin + authenticationUrl.pathname).toBe('https://bitly.com/oauth/authorize');
      expect(authenticationUrl.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
      expect(authenticationUrl.searchParams.get('client_id')).toBeTruthy();
    });

    it('exchanges the authorization code for an access token', async () => {
      await provider.requestAuthentication();

      const tokenUrl = new URL(getRequestUrl(fetchMock));

      expect(tokenUrl.origin + tokenUrl.pathname).toBe('https://api-ssl.bitly.com/oauth/access_token');
      expect(tokenUrl.searchParams.get('code')).toBe(AUTHORIZATION_CODE);
      expect(tokenUrl.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    });

    it('resolves the access token and login as the authentication', async () => {
      await expect(provider.requestAuthentication()).resolves.toEqual({
        accessToken: 'access-token',
        principal: 'user',
      });
    });

    it('tolerates a response without a login', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ access_token: 'access-token' }));

      await expect(provider.requestAuthentication()).resolves.toEqual({
        accessToken: 'access-token',
        principal: null,
      });
    });

    it('does not persist the authentication, leaving that to the caller', async () => {
      await provider.requestAuthentication();

      expect(repository.set).not.toHaveBeenCalled();
    });

    it('rejects when the user cancels the web auth flow', async () => {
      getBrowserApiMock().identity.launchWebAuthFlow.mockResolvedValue(undefined);

      await expect(provider.requestAuthentication()).rejects.toThrow('missing redirect URI');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects when the redirect URI carries no authorization code', async () => {
      getBrowserApiMock().identity.launchWebAuthFlow.mockResolvedValue(`${REDIRECT_URI}?error=access_denied`);

      await expect(provider.requestAuthentication()).rejects.toThrow('missing authorization code');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects when the token exchange fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'boom' }, { status: 500 }));

      await expect(provider.requestAuthentication()).rejects.toThrow('error response');
    });

    it('rejects when the token exchange succeeds without an access token', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ login: 'user' }));

      await expect(provider.requestAuthentication()).rejects.toThrow('missing access token');
    });

    it('rejects when the token exchange returns an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse());

      await expect(provider.requestAuthentication()).rejects.toThrow();
    });
  });

  describe('authenticate', () => {
    it('persists the authentication it obtains', async () => {
      await expect(provider.authenticate()).resolves.toEqual({
        accessToken: 'access-token',
        principal: 'user',
      });
      expect(data).toEqual(createData('access-token', 'user'));
    });

    it('reuses a stored authentication rather than prompting the user again', async () => {
      data = createData('stored-token', 'stored-user');

      await expect(provider.authenticate()).resolves.toEqual({
        accessToken: 'stored-token',
        principal: 'stored-user',
      });
      expect(getBrowserApiMock().identity.launchWebAuthFlow).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('revokeAuthentication', () => {
    it('clears the stored access token and principal', async () => {
      data = createData('stored-token', 'stored-user');

      await provider.revokeAuthentication();

      expect(data).toEqual(createData(null, null));
      await expect(provider.getAuthentication()).resolves.toBeNull();
    });
  });
});

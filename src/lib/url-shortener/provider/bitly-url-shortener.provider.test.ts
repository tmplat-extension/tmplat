import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import {
  getRequestHeaders,
  getRequestJsonBody,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  malformedJsonResponse,
} from 'extension/test/fetch.mock';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { asOAuthService, createOAuthServiceMock, type OAuthServiceMock } from 'extension/test/oauth.mock';
import { BitlyUrlShortenerProvider } from 'extension/url-shortener/provider/bitly-url-shortener.provider';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

const ACCESS_TOKEN = 'access-token';
const URL_TO_SHORTEN = new URL('https://example.com/a/b?c=1');

describe('BitlyUrlShortenerProvider', () => {
  let fetchMock: Mock<typeof fetch>;
  let logging: LoggingServiceMock;
  let oauthService: OAuthServiceMock;
  let provider: BitlyUrlShortenerProvider;

  const createProvider = (oauth: OAuthServiceMock) => {
    oauthService = oauth;

    return new BitlyUrlShortenerProvider(
      asIntlService(createIntlServiceMock()),
      logging as unknown as LoggingService,
      asOAuthService(oauth),
    );
  };

  beforeEach(() => {
    fetchMock = installFetchMock();
    logging = createLoggingServiceMock();
    provider = createProvider(createOAuthServiceMock({ accessToken: ACCESS_TOKEN, principal: 'user' }));
  });

  it('is named after the Bitly provider', () => {
    expect(provider.name).toBe(UrlShortenerProviderName.Bitly);
  });

  describe('isDataValid', () => {
    it('is valid once the user has connected their Bitly account', async () => {
      await expect(provider.isDataValid()).resolves.toBe(true);
      expect(oauthService.getAuthentication).toHaveBeenCalledWith(OAuthProviderName.Bitly);
    });

    it('is invalid while the user has not connected their Bitly account', async () => {
      provider = createProvider(createOAuthServiceMock(null));

      await expect(provider.isDataValid()).resolves.toBe(false);
    });
  });

  describe('shorten', () => {
    it('posts the URL to the Bitly v4 shorten endpoint', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ link: 'https://bit.ly/abc' }));

      await provider.shorten(URL_TO_SHORTEN);

      expect(getRequestUrl(fetchMock)).toBe('https://api-ssl.bitly.com/v4/shorten');
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
      expect(getRequestJsonBody(fetchMock)).toEqual({ long_url: URL_TO_SHORTEN.toString() });
    });

    it("authorizes the request with the connected account's access token", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ link: 'https://bit.ly/abc' }));

      await provider.shorten(URL_TO_SHORTEN);

      expect(getRequestHeaders(fetchMock).Authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    });

    it('does not send a branded domain, so the account default is used', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ link: 'https://bit.ly/abc' }));

      await provider.shorten(URL_TO_SHORTEN);

      expect(getRequestJsonBody(fetchMock)).not.toHaveProperty('domain');
    });

    it('returns the link field from the response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 'bit.ly/abc', link: 'https://bit.ly/abc' }));

      await expect(provider.shorten(URL_TO_SHORTEN)).resolves.toBe('https://bit.ly/abc');
    });

    it('rejects a success response that is missing link', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 'bit.ly/abc' }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('never falls back to a shared token when the account is not connected', async () => {
      provider = createProvider(createOAuthServiceMock(null));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toThrow('Bitly authentication missing');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an unsuccessful response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'boom' }, { status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO500000' });
      expect(oauthService.revokeAuthentication).not.toHaveBeenCalled();
    });

    it('rejects cleanly when an unsuccessful response has an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse({ status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('rejects cleanly when a successful response has an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse());

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('still revokes the authentication when a 401 has an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse({ status: 401 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO401000' });
      expect(oauthService.revokeAuthentication).toHaveBeenCalledWith(OAuthProviderName.Bitly);
    });

    it('revokes the stored authentication when Bitly reports the token is no longer valid', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'FORBIDDEN' }, { status: 401 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO401000' });
      expect(oauthService.revokeAuthentication).toHaveBeenCalledWith(OAuthProviderName.Bitly);
    });

    it('propagates a network failure', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toThrow('Failed to fetch');
    });
  });
});

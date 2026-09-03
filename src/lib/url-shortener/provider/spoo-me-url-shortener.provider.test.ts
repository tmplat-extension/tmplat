import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
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
import { SpooMeUrlShortenerProvider } from 'extension/url-shortener/provider/spoo-me-url-shortener.provider';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

const URL_TO_SHORTEN = new URL('https://example.com/a/b?c=1');

describe('SpooMeUrlShortenerProvider', () => {
  let fetchMock: Mock<typeof fetch>;
  let logging: LoggingServiceMock;
  let provider: SpooMeUrlShortenerProvider;

  beforeEach(() => {
    fetchMock = installFetchMock();
    logging = createLoggingServiceMock();
    provider = new SpooMeUrlShortenerProvider(
      asIntlService(createIntlServiceMock()),
      logging as unknown as LoggingService,
    );
  });

  it('is named after the spoo.me provider', () => {
    expect(provider.name).toBe(UrlShortenerProviderName.SpooMe);
  });

  it('requires no configuration, so its data is always valid', () => {
    expect(provider.isDataValid()).toBe(true);
  });

  describe('shorten', () => {
    it('posts the URL as JSON to the v1 endpoint, never the insecure legacy one', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ short_url: 'https://spoo.me/abc' }));

      await provider.shorten(URL_TO_SHORTEN);

      expect(getRequestUrl(fetchMock)).toBe('https://spoo.me/api/v1/shorten');
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
      expect(getRequestJsonBody(fetchMock)).toEqual({ url: URL_TO_SHORTEN.toString() });
      expect(getRequestHeaders(fetchMock)).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      });
    });

    it('returns the short_url field from the response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ short_url: 'https://spoo.me/abc' }));

      await expect(provider.shorten(URL_TO_SHORTEN)).resolves.toBe('https://spoo.me/abc');
    });

    it('rejects a success response that is missing short_url', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'rate limited' }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it.each([
      ['a non-object body', jsonResponse('https://spoo.me/abc')],
      ['a null body', jsonResponse(null)],
      ['an array body', jsonResponse([{ short_url: 'https://spoo.me/abc' }])],
    ])('rejects a success response with %s', async (_label, response) => {
      fetchMock.mockResolvedValue(response);

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('rejects a short_url pointing at a different host', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ short_url: 'https://evil.example/abc' }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('rejects an unsuccessful response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'nope' }, { status: 429 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('rejects cleanly when an unsuccessful response has an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse({ status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('rejects cleanly when a successful response has an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse());

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('logs the failure status', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'nope' }, { status: 429 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toThrow();
      expect(logging.logger.error).toHaveBeenCalledWith(expect.stringContaining('spoo.me'), {
        body: { error: 'nope' },
        status: 429,
        url: URL_TO_SHORTEN.toString(),
      });
    });

    it('propagates a network failure', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toThrow('Failed to fetch');
    });
  });
});

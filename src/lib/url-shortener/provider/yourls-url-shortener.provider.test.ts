import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
import {
  getRequestFormBody,
  getRequestHeaders,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  malformedJsonResponse,
} from 'extension/test/fetch.mock';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { type UrlShortenerDataYourlsProvider } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';
import { YourlsUrlShortenerProvider } from 'extension/url-shortener/provider/yourls-url-shortener.provider';

const URL_TO_SHORTEN = new URL('https://example.com/a/b?c=1');
const YOURLS_URL = 'https://yourls.example.com/yourls-api.php';

const createData = (overrides: Partial<UrlShortenerDataYourlsProvider> = {}): UrlShortenerDataYourlsProvider => ({
  authenticationMode: null,
  password: null,
  signature: null,
  url: YOURLS_URL,
  username: null,
  ...overrides,
});

const successResponse = (shorturl = 'https://yourls.example.com/abc') => jsonResponse({ shorturl, status: 'success' });

/** YOURLS reports an already-shortened URL as an error, yet still returns the existing `shorturl`. */
const alreadyShortenedResponse = () =>
  jsonResponse(
    { code: 'error:url', message: 'already exists', shorturl: 'https://yourls.example.com/existing' },
    { status: 400 },
  );

describe('YourlsUrlShortenerProvider', () => {
  let fetchMock: Mock<typeof fetch>;
  let logging: LoggingServiceMock;
  let provider: YourlsUrlShortenerProvider;

  beforeEach(() => {
    fetchMock = installFetchMock();
    logging = createLoggingServiceMock();
    provider = new YourlsUrlShortenerProvider(
      asIntlService(createIntlServiceMock()),
      logging as unknown as LoggingService,
    );
  });

  it('is named after the YOURLS provider', () => {
    expect(provider.name).toBe(UrlShortenerProviderName.Yourls);
  });

  describe('isDataValid', () => {
    it('requires an installation URL', () => {
      expect(provider.isDataValid(createData({ url: null }))).toBe(false);
    });

    it('accepts a URL alone when no authentication mode is set', () => {
      expect(provider.isDataValid(createData())).toBe(true);
    });

    describe('advanced authentication', () => {
      const data = createData({ authenticationMode: YourlsAuthenticationMode.Advanced });

      it('requires a signature', () => {
        expect(provider.isDataValid({ ...data, signature: null })).toBe(false);
      });

      it('accepts a signature', () => {
        expect(provider.isDataValid({ ...data, signature: 'sig' })).toBe(true);
      });
    });

    describe('basic authentication', () => {
      const data = createData({ authenticationMode: YourlsAuthenticationMode.Basic });

      it.each([
        ['neither username nor password', null, null],
        ['only a username', 'user', null],
        ['only a password', null, 'pass'],
      ])('rejects %s', (_label, username, password) => {
        expect(provider.isDataValid({ ...data, password, username })).toBe(false);
      });

      it('accepts both a username and password', () => {
        expect(provider.isDataValid({ ...data, password: 'pass', username: 'user' })).toBe(true);
      });
    });
  });

  describe('shorten', () => {
    it('posts a form-encoded shorturl action to the configured installation', async () => {
      fetchMock.mockResolvedValue(successResponse());

      await provider.shorten(URL_TO_SHORTEN, createData());

      expect(getRequestUrl(fetchMock)).toBe(YOURLS_URL);
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
      expect(getRequestHeaders(fetchMock)).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      const body = getRequestFormBody(fetchMock);

      expect(body.get('action')).toBe('shorturl');
      expect(body.get('format')).toBe('json');
      expect(body.get('url')).toBe(URL_TO_SHORTEN.toString());
    });

    it('sends no credentials when no authentication mode is set', async () => {
      fetchMock.mockResolvedValue(successResponse());

      await provider.shorten(URL_TO_SHORTEN, createData());

      const body = getRequestFormBody(fetchMock);

      expect([...body.keys()].toSorted()).toEqual(['action', 'format', 'url']);
    });

    it('sends the username and password for basic authentication', async () => {
      fetchMock.mockResolvedValue(successResponse());

      await provider.shorten(
        URL_TO_SHORTEN,
        createData({
          authenticationMode: YourlsAuthenticationMode.Basic,
          password: 'pass',
          username: 'user',
        }),
      );

      const body = getRequestFormBody(fetchMock);

      expect(body.get('username')).toBe('user');
      expect(body.get('password')).toBe('pass');
      expect(body.get('signature')).toBeNull();
    });

    describe('advanced authentication', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('sends a time-limited SHA-256 signature rather than the raw token', async () => {
        fetchMock.mockResolvedValue(successResponse());

        await provider.shorten(
          URL_TO_SHORTEN,
          createData({ authenticationMode: YourlsAuthenticationMode.Advanced, signature: 'raw-token' }),
        );

        const body = getRequestFormBody(fetchMock);
        const timestamp = String(Math.floor(Date.parse('2026-01-01T00:00:00.000Z') / 1000));

        expect(body.get('timestamp')).toBe(timestamp);
        expect(body.get('hash')).toBe('sha256');
        expect(body.get('signature')).toMatch(/^[0-9a-f]{64}$/);
        expect(body.get('signature')).not.toBe('raw-token');
        expect(body.get('username')).toBeNull();
      });

      it('produces a different signature as time passes, so it cannot be replayed indefinitely', async () => {
        fetchMock.mockImplementation(() => Promise.resolve(successResponse()));

        const data = createData({
          authenticationMode: YourlsAuthenticationMode.Advanced,
          signature: 'raw-token',
        });

        await provider.shorten(URL_TO_SHORTEN, data);
        vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
        await provider.shorten(URL_TO_SHORTEN, data);

        expect(getRequestFormBody(fetchMock, 0).get('signature')).not.toBe(
          getRequestFormBody(fetchMock, 1).get('signature'),
        );
      });
    });

    it('returns the shorturl from a successful response', async () => {
      fetchMock.mockResolvedValue(successResponse('https://yourls.example.com/abc'));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).resolves.toBe('https://yourls.example.com/abc');
    });

    it('does not constrain the shorturl host, since the installation is self-hosted', async () => {
      fetchMock.mockResolvedValue(successResponse('https://short.example.org/abc'));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).resolves.toBe('https://short.example.org/abc');
    });

    it('rejects a 200 response whose status is not success', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'nope', status: 'fail' }));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('rejects a successful response that is missing shorturl', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success' }));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('rejects an unsuccessful response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'boom' }, { status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).rejects.toMatchObject({ code: 'SHO500000' });
    });

    // A self-hosted installation behind a reverse proxy commonly returns an HTML error page rather than JSON, which
    // must still surface as a shortening failure rather than a raw SyntaxError
    it('rejects cleanly when an unsuccessful response has an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse({ status: 502 }));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('rejects an unsuccessful response whose body is JSON but not an object', async () => {
      fetchMock.mockResolvedValue(jsonResponse('error:url', { status: 400 }));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('rejects cleanly when a successful response has an unparseable body', async () => {
      fetchMock.mockResolvedValue(malformedJsonResponse());

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).rejects.toMatchObject({ code: 'SHO422100' });
    });

    describe('when the URL has already been shortened', () => {
      it('treats the error:url response as a success and returns the existing shorturl', async () => {
        fetchMock.mockResolvedValue(alreadyShortenedResponse());

        await expect(provider.shorten(URL_TO_SHORTEN, createData())).resolves.toBe(
          'https://yourls.example.com/existing',
        );
      });

      // Regression test: the error body used to only be read when error logging was enabled, which made this
      // recovery dead code for any user who had turned logging off
      it('recovers regardless of whether error logging is enabled', async () => {
        logging.logger.isLevelEnabled.mockReturnValue(false);
        fetchMock.mockResolvedValue(alreadyShortenedResponse());

        await expect(provider.shorten(URL_TO_SHORTEN, createData())).resolves.toBe(
          'https://yourls.example.com/existing',
        );
      });
    });

    it('propagates a network failure', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(provider.shorten(URL_TO_SHORTEN, createData())).rejects.toThrow('Failed to fetch');
    });
  });
});

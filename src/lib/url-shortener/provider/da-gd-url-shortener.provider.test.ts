import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { getRequestHeaders, getRequestUrl, installFetchMock, textResponse } from 'extension/test/fetch.mock';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { DaGdUrlShortenerProvider } from 'extension/url-shortener/provider/da-gd-url-shortener.provider';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

const URL_TO_SHORTEN = new URL('https://example.com/a/b?c=1');

describe('DaGdUrlShortenerProvider', () => {
  let fetchMock: Mock<typeof fetch>;
  let logging: LoggingServiceMock;
  let provider: DaGdUrlShortenerProvider;

  beforeEach(() => {
    fetchMock = installFetchMock();
    logging = createLoggingServiceMock();
    provider = new DaGdUrlShortenerProvider(
      asIntlService(createIntlServiceMock()),
      logging as unknown as LoggingService,
    );
  });

  it('is named after the da.gd provider', () => {
    expect(provider.name).toBe(UrlShortenerProviderName.DaGd);
  });

  it('requires no configuration, so its data is always valid', () => {
    expect(provider.isDataValid()).toBe(true);
  });

  describe('shorten', () => {
    it('requests the shortener with the URL encoded as a query parameter', async () => {
      fetchMock.mockResolvedValue(textResponse('https://da.gd/abc\n'));

      await provider.shorten(URL_TO_SHORTEN);

      expect(getRequestUrl(fetchMock)).toBe(
        `https://da.gd/shorten?url=${encodeURIComponent(URL_TO_SHORTEN.toString())}`,
      );
      expect(getRequestHeaders(fetchMock)).toEqual({ Accept: 'text/plain' });
    });

    it('returns the plain text body, trimmed of its trailing newline', async () => {
      fetchMock.mockResolvedValue(textResponse('https://da.gd/abc\n'));

      await expect(provider.shorten(URL_TO_SHORTEN)).resolves.toBe('https://da.gd/abc');
    });

    it('rejects a success response whose body is not a URL', async () => {
      fetchMock.mockResolvedValue(textResponse('rate limit exceeded'));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('rejects a success response pointing at a different host', async () => {
      fetchMock.mockResolvedValue(textResponse('https://evil.example/abc'));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO422100' });
    });

    it('rejects an unsuccessful response', async () => {
      fetchMock.mockResolvedValue(textResponse('nope', { status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('throws an ExtensionError, so the failure is presentable to the user', async () => {
      fetchMock.mockResolvedValue(textResponse('nope', { status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toBeInstanceOf(ExtensionError);
    });

    it('logs the failure body and status', async () => {
      fetchMock.mockResolvedValue(textResponse('nope', { status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toThrow();
      expect(logging.logger.error).toHaveBeenCalledWith(expect.stringContaining('da.gd'), {
        body: 'nope',
        status: 500,
        url: URL_TO_SHORTEN.toString(),
      });
    });

    it('still fails cleanly when error logging is disabled', async () => {
      logging.logger.isLevelEnabled.mockReturnValue(false);
      fetchMock.mockResolvedValue(textResponse('nope', { status: 500 }));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toMatchObject({ code: 'SHO500000' });
      expect(logging.logger.error).not.toHaveBeenCalled();
    });

    it('propagates a network failure', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(provider.shorten(URL_TO_SHORTEN)).rejects.toThrow('Failed to fetch');
    });
  });
});

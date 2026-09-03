import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { asIntlService, createIntlServiceMock, type IntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { type UrlShortenerDataRepository } from 'extension/url-shortener/data/url-shortener-data.repository';
import {
  type UrlShortenerData,
  type UrlShortenerDataProvider,
} from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { type UrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';
import { UrlShortenerService } from 'extension/url-shortener/url-shortener.service';

const LONG_URL = 'https://example.com/some/long/path?with=query';
const SHORT_URL = 'https://exmpl.co/abc';

type ProviderStub = {
  [K in keyof UrlShortenerProvider<UrlShortenerDataProvider>]: UrlShortenerProvider<UrlShortenerDataProvider>[K];
};

const createProviderStub = (
  name: UrlShortenerProviderName,
  overrides: Partial<ProviderStub> = {},
): UrlShortenerProvider<UrlShortenerDataProvider> => ({
  name,
  isDataValid: vi.fn(() => true),
  shorten: vi.fn(async () => SHORT_URL),
  ...overrides,
});

const createData = (provider: UrlShortenerProviderName = UrlShortenerProviderName.SpooMe): UrlShortenerData =>
  ({
    provider,
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
  }) as UrlShortenerData;

describe('UrlShortenerService', () => {
  let intl: IntlServiceMock;
  let logging: LoggingServiceMock;
  let repository: { get: ReturnType<typeof vi.fn> };
  let providers: UrlShortenerProvider<UrlShortenerDataProvider>[];

  const createService = () =>
    new UrlShortenerService(
      asIntlService(intl),
      logging as unknown as LoggingService,
      providers,
      repository as unknown as UrlShortenerDataRepository,
    );

  beforeEach(() => {
    intl = createIntlServiceMock();
    logging = createLoggingServiceMock();
    repository = { get: vi.fn(async () => createData()) };
    providers = [
      createProviderStub(UrlShortenerProviderName.SpooMe),
      createProviderStub(UrlShortenerProviderName.Yourls),
    ];
  });

  describe('shorten', () => {
    it('delegates to the provider selected in the repository and returns its short URL', async () => {
      const result = await createService().shorten(LONG_URL);

      expect(result).toBe(SHORT_URL);
      const spooMe = providers[0];
      expect(spooMe.shorten).toHaveBeenCalledTimes(1);
      const [urlArg, dataArg] = (spooMe.shorten as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(urlArg).toBeInstanceOf(URL);
      expect((urlArg as URL).toString()).toBe(new URL(LONG_URL).toString());
      expect(dataArg).toEqual({});
      expect(providers[1].shorten as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    });

    it('accepts a URL instance without reparsing it', async () => {
      const url = new URL(LONG_URL);

      await createService().shorten(url);

      const [urlArg] = (providers[0].shorten as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(urlArg).toBe(url);
    });

    it('passes the selected provider its own configuration data', async () => {
      repository.get.mockResolvedValue(createData(UrlShortenerProviderName.Yourls));

      await createService().shorten(LONG_URL);

      const [, dataArg] = (providers[1].shorten as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(dataArg).toEqual({
        authenticationMode: null,
        password: null,
        signature: null,
        url: null,
        username: null,
      });
    });

    it('rejects with SHO422000 when the URL string cannot be parsed', async () => {
      let promise!: Promise<unknown>;
      expect(() => {
        promise = createService().shorten('not a url');
      }).not.toThrow();

      await expect(promise).rejects.toBeInstanceOf(ExtensionError);
      await expect(promise).rejects.toMatchObject({ code: 'SHO422000' });
      expect(providers[0].shorten).not.toHaveBeenCalled();
    });

    it('rejects with SHO404000 when the selected provider is not registered', async () => {
      providers = [createProviderStub(UrlShortenerProviderName.SpooMe)];
      repository.get.mockResolvedValue(createData(UrlShortenerProviderName.Bitly));

      await expect(createService().shorten(LONG_URL)).rejects.toMatchObject({ code: 'SHO404000' });
    });

    it('localizes the provider name for the SHO404000 error', async () => {
      providers = [createProviderStub(UrlShortenerProviderName.SpooMe)];
      repository.get.mockResolvedValue(createData(UrlShortenerProviderName.Bitly));

      await expect(createService().shorten(LONG_URL)).rejects.toBeDefined();
      expect(intl.getMessage).toHaveBeenCalledWith('url_shortener_name_bitly');
    });

    it('rejects with SHO404100 when the provider reports its data is invalid', async () => {
      (providers[0].isDataValid as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await expect(createService().shorten(LONG_URL)).rejects.toMatchObject({ code: 'SHO404100' });
      expect(providers[0].shorten).not.toHaveBeenCalled();
    });

    it('awaits an async isDataValid before deciding validity', async () => {
      (providers[0].isDataValid as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(createService().shorten(LONG_URL)).rejects.toMatchObject({ code: 'SHO404100' });
    });

    it('wraps a provider failure in SHO500000', async () => {
      (providers[0].shorten as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

      await expect(createService().shorten(LONG_URL)).rejects.toMatchObject({ code: 'SHO500000' });
    });

    it('preserves an ExtensionError thrown by the provider (fallback returns it unchanged)', async () => {
      const original = ExtensionError.from('SHO422100', 'spoo.me');
      (providers[0].shorten as ReturnType<typeof vi.fn>).mockRejectedValue(original);

      await expect(createService().shorten(LONG_URL)).rejects.toBe(original);
    });

    it('logs the failure when error logging is enabled', async () => {
      (providers[0].shorten as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

      await expect(createService().shorten(LONG_URL)).rejects.toBeDefined();
      expect(logging.logger.error).toHaveBeenCalledTimes(1);
    });

    it('does not build the error log message when error logging is disabled', async () => {
      logging.logger.isLevelEnabled.mockReturnValue(false);
      (providers[0].shorten as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

      await expect(createService().shorten(LONG_URL)).rejects.toMatchObject({ code: 'SHO500000' });
      expect(logging.logger.error).not.toHaveBeenCalled();
    });
  });
});

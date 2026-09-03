import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.model';
import { urlShortenerDataSchema } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

export const UrlShortenerDataRepositoryToken = Symbol('UrlShortenerDataRepository');

@injectable()
export class UrlShortenerDataRepository extends RequiredDataRepository<UrlShortenerData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    // Bitly's token and any YOURLS credentials are stored alongside the provider selection, so this deliberately
    // uses local (device-only) storage rather than sync
    super(DataNamespace.UrlShortener, urlShortenerDataSchema, dataService.local);
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      // spoo.me requires no configuration or authentication and has generous anonymous rate limits, making it the
      // best default for a user who has not yet made an explicit choice
      provider: UrlShortenerProviderName.SpooMe,
      providers: {
        [UrlShortenerProviderName.Bitly]: {},
        [UrlShortenerProviderName.DaGd]: {},
        [UrlShortenerProviderName.SpooMe]: {},
        [UrlShortenerProviderName.Yourls]: {
          authenticationMode: null,
          url: null,
          username: null,
          password: null,
          signature: null,
        },
      },
    }));
  }
}

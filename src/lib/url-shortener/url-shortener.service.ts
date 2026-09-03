import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionErrorFactory, ExtensionErrorFactoryToken } from 'extension/common/extension-error-factory';
import { isString } from 'extension/common/type.utils';
import { UrlShortenerDataProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import {
  UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import {
  UrlShortenerProvider,
  UrlShortenerProviderToken,
} from 'extension/url-shortener/provider/url-shortener.provider';

export const UrlShortenerServiceToken = Symbol('UrlShortenerService');

@injectable()
export class UrlShortenerService {
  constructor(
    @inject(ExtensionErrorFactoryToken) private readonly errorFactory: ExtensionErrorFactory,
    @multiInject(UrlShortenerProviderToken)
    private readonly providers: UrlShortenerProvider<UrlShortenerDataProvider>[],
    @inject(UrlShortenerDataRepositoryToken) private readonly repository: UrlShortenerDataRepository,
  ) {}

  async shorten(url: string | URL): Promise<string> {
    if (isString(url)) {
      try {
        url = new URL(url);
      } catch (_) {
        throw this.errorFactory.intl('url_shortener_error_invalid_url_description');
      }
    }

    const data = await this.repository.get();
    const providerName = data.provider;
    const providerData = data.providers[providerName];

    const provider = this.providers.find((provider) => provider.name === providerName);
    if (!provider) {
      throw this.errorFactory.intl('url_shortener_error_provider_not_found_description', providerName);
    }

    if (!(await provider.isDataValid(providerData))) {
      throw this.errorFactory.intl('url_shortener_error_not_configured_description', providerName);
    }

    // TODO: Track for analytics?
    return provider.shorten(url, providerData);
  }
}

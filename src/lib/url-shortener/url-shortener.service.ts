import { isString } from 'lodash-es';

import { inject, injectable, multiInject } from 'extension/common/di';
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
    @multiInject(UrlShortenerProviderToken) private readonly providers: UrlShortenerProvider<any>[],
    @inject(UrlShortenerDataRepositoryToken) private readonly repository: UrlShortenerDataRepository,
  ) {}

  async shorten(url: string | URL): Promise<string> {
    if (isString(url)) {
      try {
        url = new URL(url);
      } catch (e) {
        // TODO: Localise error message and use ExtensionError instead
        throw new Error('Cannot shorten an invalid URL');
      }
    }

    const data = await this.repository.get();
    const providerEntry = Object.entries(data.providers).find(([, value]) => value.enabled);
    if (!providerEntry) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error('No URL shortener providers enabled');
    }

    const [providerName, providerData] = providerEntry;
    const provider = this.providers.find((provider) => provider.name === providerName);
    if (!provider) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`URL shortener provider '${providerName}' not found`);
    }

    if (!provider.isDataValid(providerData)) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`URL shortener provider '${providerName}' is not configured correctly`);
    }

    // TODO: Track for analytics?
    return provider.shorten(url, providerData);
  }
}

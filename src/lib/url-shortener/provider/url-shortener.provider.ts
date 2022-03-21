import { UrlShortenerDataProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

export const UrlShortenerProviderToken = Symbol('UrlShortenerProvider');

export interface UrlShortenerProvider<D extends UrlShortenerDataProvider> {
  readonly name: UrlShortenerProviderName;

  isDataValid(data: Readonly<D>): boolean;

  shorten(url: URL, data: Readonly<D>): Promise<string>;
}

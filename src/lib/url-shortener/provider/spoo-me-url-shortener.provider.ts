import { inject, injectable } from 'extension/common/di';
import { ExtensionErrorFactory, ExtensionErrorFactoryToken } from 'extension/common/extension-error-factory';
import { UrlShortenerDataSpooMeProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { extractJsonField, extractShortUrl } from 'extension/url-shortener/provider/url-shortener-response.utils';
import { UrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';

/**
 * spoo.me is the default, no-configuration-required URL shortener: it requires no account or API key, has generous
 * anonymous rate limits (20/min, 200/day, at time of writing) and a stable, documented JSON API. Its legacy `POST /`
 * (v0) endpoint is deliberately never used here — it returns insecure `http://` links and is limited to 5/min, 50/day.
 */
@injectable()
export class SpooMeUrlShortenerProvider implements UrlShortenerProvider<UrlShortenerDataSpooMeProvider> {
  readonly name = UrlShortenerProviderName.SpooMe;

  constructor(@inject(ExtensionErrorFactoryToken) private readonly errorFactory: ExtensionErrorFactory) {}

  isDataValid(): boolean {
    return true;
  }

  async shorten(url: URL): Promise<string> {
    const response = await fetch('https://spoo.me/api/v1/shorten', {
      body: JSON.stringify({ url: url.toString() }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw this.errorFactory.intl('url_shortener_error_request_failed_description', this.name);
    }

    const body = await response.json();
    return extractShortUrl(
      this.errorFactory,
      this.name,
      extractJsonField(this.errorFactory, this.name, body, 'short_url'),
      'spoo.me',
    );
  }
}

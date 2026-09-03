import { inject, injectable } from 'extension/common/di';
import { ExtensionErrorFactory, ExtensionErrorFactoryToken } from 'extension/common/extension-error-factory';
import { UrlShortenerDataDaGdProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { extractShortUrl } from 'extension/url-shortener/provider/url-shortener-response.utils';
import { UrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';

/**
 * da.gd is a secondary no-configuration-required URL shortener option: it requires no account or API key, but unlike
 * spoo.me it currently has no published Terms of Service or Privacy Policy, so it is offered as an alternative
 * rather than the default.
 */
@injectable()
export class DaGdUrlShortenerProvider implements UrlShortenerProvider<UrlShortenerDataDaGdProvider> {
  readonly name = UrlShortenerProviderName.DaGd;

  constructor(@inject(ExtensionErrorFactoryToken) private readonly errorFactory: ExtensionErrorFactory) {}

  isDataValid(): boolean {
    return true;
  }

  async shorten(url: URL): Promise<string> {
    const response = await fetch(`https://da.gd/shorten?url=${encodeURIComponent(url.toString())}`, {
      headers: { Accept: 'text/plain' },
    });

    if (!response.ok) {
      throw this.errorFactory.intl('url_shortener_error_request_failed_description', this.name);
    }

    // da.gd's success response is the shortened URL as plain text (with a trailing newline), not JSON
    const body = (await response.text()).trim();
    return extractShortUrl(this.errorFactory, this.name, body, 'da.gd');
  }
}

import { sha256Hex } from 'extension/common/crypto.utils';
import { inject, injectable } from 'extension/common/di';
import { ExtensionErrorFactory, ExtensionErrorFactoryToken } from 'extension/common/extension-error-factory';
import { UrlShortenerDataYourlsProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { extractJsonField, extractShortUrl } from 'extension/url-shortener/provider/url-shortener-response.utils';
import { UrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

@injectable()
export class YourlsUrlShortenerProvider implements UrlShortenerProvider<UrlShortenerDataYourlsProvider> {
  readonly name = UrlShortenerProviderName.Yourls;

  constructor(@inject(ExtensionErrorFactoryToken) private readonly errorFactory: ExtensionErrorFactory) {}

  isDataValid(data: Readonly<UrlShortenerDataYourlsProvider>): boolean {
    if (!data.url) {
      return false;
    }

    switch (data.authenticationMode) {
      case YourlsAuthenticationMode.Advanced:
        return !!data.signature;
      case YourlsAuthenticationMode.Basic:
        return !!(data.username && data.password);
      default:
        return true;
    }
  }

  async shorten(url: URL, data: Readonly<UrlShortenerDataYourlsProvider>): Promise<string> {
    const response = await fetch(data.url!, {
      body: await this.createRequestBody(url, data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    const body = await response.json();

    if (!response.ok) {
      // YOURLS returns a non-2xx status (currently 400, historically inconsistent) when the URL has already been
      // shortened and unique URLs are enforced, even though the existing `shorturl` is still returned in the body,
      // so this is deliberately treated as a success rather than an error
      if (extractJsonField(this.errorFactory, this.name, body, 'code') === 'error:url') {
        return extractShortUrl(
          this.errorFactory,
          this.name,
          extractJsonField(this.errorFactory, this.name, body, 'shorturl'),
        );
      }

      throw this.errorFactory.intl('url_shortener_error_request_failed_description', this.name);
    }

    if (extractJsonField(this.errorFactory, this.name, body, 'status') !== 'success') {
      throw this.errorFactory.intl('url_shortener_error_request_failed_description', this.name);
    }

    return extractShortUrl(
      this.errorFactory,
      this.name,
      extractJsonField(this.errorFactory, this.name, body, 'shorturl'),
    );
  }

  private async createRequestBody(url: URL, data: Readonly<UrlShortenerDataYourlsProvider>): Promise<string> {
    const body = new URLSearchParams({ action: 'shorturl', format: 'json', url: url.toString() });

    switch (data.authenticationMode) {
      case YourlsAuthenticationMode.Advanced: {
        // A time-limited (12 hours by default) hashed signature is used, rather than the permanent raw signature
        // token, so that a signature intercepted or logged in transit cannot be replayed indefinitely
        const timestamp = Math.floor(Date.now() / 1000).toString();
        body.set('timestamp', timestamp);
        body.set('signature', await sha256Hex(`${timestamp}${data.signature}`));
        body.set('hash', 'sha256');
        break;
      }
      case YourlsAuthenticationMode.Basic:
        body.set('username', data.username!);
        body.set('password', data.password!);
        break;
    }

    return body.toString();
  }
}

import { decodeBase64 } from 'extension/common/codec/base64.utils';
import { injectable } from 'extension/common/di';
import { UrlShortenerDataYourlsProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { UrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

@injectable()
export class YourlsUrlShortenerProvider implements UrlShortenerProvider<UrlShortenerDataYourlsProvider> {
  readonly name = UrlShortenerProviderName.Yourls;

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
      body: this.createRequestBody(url, data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    if (!response.ok) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`URL shortener provider '${this.name}' could not shorten URL due to error response`);
    }

    return (await response.json()).shorturl;
  }

  private createRequestBody(url: URL, data: Readonly<UrlShortenerDataYourlsProvider>): string {
    const body = new URLSearchParams({ action: 'shorturl', format: 'json', url: url.toString() });

    switch (data.authenticationMode) {
      case YourlsAuthenticationMode.Advanced:
        body.set('signature', decodeBase64(data.signature!));
        break;
      case YourlsAuthenticationMode.Basic:
        body.set('username', decodeBase64(data.username!));
        body.set('password', decodeBase64(data.password!));
        break;
    }

    return body.toString();
  }
}

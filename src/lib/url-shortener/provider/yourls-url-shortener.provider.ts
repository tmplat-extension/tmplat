import { isPlainObject } from 'es-toolkit';
import { sha256Hex } from 'extension/common/crypto.utils';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import type { Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type UrlShortenerDataYourlsProvider } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { AbstractUrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

@injectable()
export class YourlsUrlShortenerProvider extends AbstractUrlShortenerProvider<UrlShortenerDataYourlsProvider> {
  private readonly logger: Logger;

  constructor(@inject(IntlServiceToken) intl: IntlService, @inject(LoggingServiceToken) logging: LoggingService) {
    super(UrlShortenerProviderName.Yourls, intl);

    this.logger = logging.getLogger('YourlsUrlShortenerProvider');
  }

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
    const urlString = url.toString();

    this.logger.trace(`Shortening URL via YOURLS:`, urlString);

    const response = await fetch(data.url!, {
      body: await this.createRequestBody(urlString, data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    const body = await this.parseJsonBody(response);

    if (!response.ok) {
      this.logger.error(`Failed to shorten URL via YOURLS:`, { body, status: response.status, url: urlString });

      // YOURLS returns a non-2xx status (currently 400, historically inconsistent) when the URL has already been
      // shortened and unique URLs are enforced, even though the existing `shorturl` is still returned in the body,
      // so this is deliberately treated as a success rather than an error
      if (isPlainObject(body) && body.code === 'error:url') {
        return this.extractShortUrl(body.shorturl);
      }

      throw this.createExtensionError('SHO500000');
    }

    if (this.extractJsonField(body, 'status') !== 'success') {
      this.logger.error(`Failed to shorten URL via YOURLS:`, { body, status: response.status, url: urlString });

      throw this.createExtensionError('SHO500000');
    }

    return this.extractShortUrl(this.extractJsonField(body, 'shorturl'));
  }

  private async createRequestBody(url: string, data: Readonly<UrlShortenerDataYourlsProvider>): Promise<string> {
    const body = new URLSearchParams({ action: 'shorturl', format: 'json', url });

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

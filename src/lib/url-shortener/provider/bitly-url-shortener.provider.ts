import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { type UrlShortenerDataBitlyProvider } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { AbstractUrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';

@injectable()
export class BitlyUrlShortenerProvider extends AbstractUrlShortenerProvider<UrlShortenerDataBitlyProvider> {
  private readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(OAuthServiceToken) private readonly oauthService: OAuthService,
  ) {
    super(UrlShortenerProviderName.Bitly, intl);

    this.logger = logging.getLogger('BitlyUrlShortenerProvider');
  }

  async isDataValid(): Promise<boolean> {
    const authentication = await this.oauthService.getAuthentication(OAuthProviderName.Bitly);
    return authentication != null;
  }

  async shorten(url: URL): Promise<string> {
    const urlString = url.toString();

    this.logger.trace(`Shortening URL via Bitly:`, urlString);

    // There is deliberately no fallback token: shortening always requires the user to have connected their own Bitly
    // account, so that every shortened link is created against (and attributable to) their account
    const authentication = await this.oauthService.getAuthentication(OAuthProviderName.Bitly);
    if (!authentication) {
      // Should never happen as UrlShortenerService always calls isDataValid beforehand
      throw new Error('Bitly authentication missing');
    }

    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      body: this.createRequestBody(urlString),
      headers: this.createRequestHeaders(authentication.accessToken),
      method: 'POST',
    });

    const body = await this.parseJsonBody(response);

    if (!response.ok) {
      this.logger.error(`Failed to shorten URL via Bitly:`, { body, status: response.status, url: urlString });

      if (response.status === 401) {
        // The access token is no longer valid (e.g. it was revoked from Bitly's side) and Bitly does not support
        // refresh tokens, so the only way to recover is to clear it and have the user reconnect their account
        await this.oauthService.revokeAuthentication(OAuthProviderName.Bitly);

        throw this.createExtensionError('SHO401000');
      }

      throw this.createExtensionError('SHO500000');
    }

    return this.extractShortUrl(this.extractJsonField(body, 'link'));
  }

  private createRequestBody(url: string): string {
    // No `domain` is specified so Bitly uses the connected account's default domain, rather than a branded domain
    // owned by this extension
    return JSON.stringify({ long_url: url });
  }

  private createRequestHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}

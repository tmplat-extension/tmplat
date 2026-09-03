import { inject, injectable } from 'extension/common/di';
import { ExtensionErrorFactory, ExtensionErrorFactoryToken } from 'extension/common/extension-error-factory';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { UrlShortenerDataBitlyProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { extractJsonField, extractShortUrl } from 'extension/url-shortener/provider/url-shortener-response.utils';
import { UrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';

const BitlyUrlShortenerProviderName = 'BitlyUrlShortenerProvider';

@injectable()
export class BitlyUrlShortenerProvider implements UrlShortenerProvider<UrlShortenerDataBitlyProvider> {
  readonly name = UrlShortenerProviderName.Bitly;

  private readonly logger: Logger;

  constructor(
    @inject(ExtensionErrorFactoryToken) private readonly errorFactory: ExtensionErrorFactory,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(OAuthServiceToken) private readonly oauthService: OAuthService,
  ) {
    this.logger = loggingService.createLogger(BitlyUrlShortenerProviderName);
  }

  async isDataValid(): Promise<boolean> {
    const authentication = await this.oauthService.getAuthentication(OAuthProviderName.Bitly);
    return authentication != null;
  }

  async shorten(url: URL): Promise<string> {
    // There is deliberately no fallback token: shortening always requires the user to have connected their own
    // Bitly account, so that every shortened link is created against (and attributable to) their account
    const authentication = await this.oauthService.getAuthentication(OAuthProviderName.Bitly);
    if (!authentication) {
      throw this.errorFactory.intl('url_shortener_error_bitly_not_connected_description');
    }

    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      body: this.createRequestBody(url),
      headers: this.createRequestHeaders(authentication.accessToken),
      method: 'POST',
    });

    if (!response.ok) {
      this.logger.error(`Bitly request failed:`, response.status, await response.json());

      if (response.status === 401) {
        // The access token is no longer valid (e.g. it was revoked from Bitly's side) and Bitly does not support
        // refresh tokens, so the only way to recover is to clear it and have the user reconnect their account
        await this.oauthService.revokeAuthentication(OAuthProviderName.Bitly);

        throw this.errorFactory.intl('url_shortener_error_bitly_reconnect_required_description');
      }

      throw this.errorFactory.intl('url_shortener_error_request_failed_description', this.name);
    }

    const body = await response.json();
    return extractShortUrl(this.errorFactory, this.name, extractJsonField(this.errorFactory, this.name, body, 'link'));
  }

  private createRequestBody(url: URL): string {
    // No `domain` is specified so Bitly uses the connected account's default domain, rather than a branded domain
    // owned by this extension
    return JSON.stringify({
      long_url: url,
    });
  }

  private createRequestHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}

import { inject, injectable } from 'extension/common/di';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { Logger } from 'extension/common/log/logger';
import { OAuthService, OAuthServiceToken } from 'extension/oauth/oauth.service';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { UrlShortenerDataBitlyProvider } from 'extension/url-shortener/data/url-shortener-data.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { UrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';

const BitlyUrlShortenerProviderName = 'BitlyUrlShortenerProvider';

@injectable()
export class BitlyUrlShortenerProvider implements UrlShortenerProvider<UrlShortenerDataBitlyProvider> {
  readonly name = UrlShortenerProviderName.Bitly;

  private readonly logger: Logger;

  constructor(
    @inject(LogServiceToken) logService: LogService,
    @inject(OAuthServiceToken) private readonly oauthService: OAuthService,
  ) {
    this.logger = logService.createLogger(BitlyUrlShortenerProviderName);
  }

  isDataValid(): boolean {
    return true;
  }

  async shorten(url: URL): Promise<string> {
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      body: this.createRequestBody(url),
      headers: await this.createRequestHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      this.logger.error(`Bitly request failed:`, response.status, await response.json());

      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`URL shortener provider '${this.name}' could not shorten URL due to error response`);
    }

    return (await response.json()).link;
  }

  private createRequestBody(url: URL): string {
    return JSON.stringify({
      domain: 'tmpl.at',
      long_url: url,
    });
  }

  private async createRequestHeaders(): Promise<Record<string, string>> {
    const bitlyAuthentication = await this.oauthService.getAuthentication(OAuthProviderName.Bitly);
    const accessToken = bitlyAuthentication?.accessToken ?? '4edf88767ea2dd718abe273eb1ee42a963c6eafd';

    return {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}

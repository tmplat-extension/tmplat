import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type UrlShortenerDataSpooMeProvider } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { AbstractUrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';

/**
 * spoo.me is the default, no-configuration-required URL shortener: it requires no account or API key, has generous
 * anonymous rate limits (20/min, 200/day, at time of writing) and a stable, documented JSON API. Its legacy `POST /`
 * (v0) endpoint is deliberately never used here — it returns insecure `http://` links and is limited to 5/min, 50/day.
 */
@injectable()
export class SpooMeUrlShortenerProvider extends AbstractUrlShortenerProvider<UrlShortenerDataSpooMeProvider> {
  private readonly logger: Logger;

  constructor(@inject(IntlServiceToken) intl: IntlService, @inject(LoggingServiceToken) logging: LoggingService) {
    super(UrlShortenerProviderName.SpooMe, intl);

    this.logger = logging.getLogger('SpooMeUrlShortenerProvider');
  }

  isDataValid(): boolean {
    return true;
  }

  async shorten(url: URL): Promise<string> {
    const urlString = url.toString();

    this.logger.trace(`Shortening URL via spoo.me:`, urlString);

    const response = await fetch('https://spoo.me/api/v1/shorten', {
      body: JSON.stringify({ url: urlString }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const body = await this.parseJsonBody(response);

    if (!response.ok) {
      this.logger.error(`Failed to shorten URL via spoo.me:`, { body, status: response.status, url: urlString });

      throw this.createExtensionError('SHO500000');
    }

    return this.extractShortUrl(this.extractJsonField(body, 'short_url'), 'spoo.me');
  }
}

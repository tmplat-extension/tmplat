import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import type { Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type UrlShortenerDataDaGdProvider } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { AbstractUrlShortenerProvider } from 'extension/url-shortener/provider/url-shortener.provider';

/**
 * da.gd is a secondary no-configuration-required URL shortener option: it requires no account or API key, but unlike
 * spoo.me it currently has no published Terms of Service or Privacy Policy, so it is offered as an alternative
 * rather than the default.
 */
@injectable()
export class DaGdUrlShortenerProvider extends AbstractUrlShortenerProvider<UrlShortenerDataDaGdProvider> {
  private readonly logger: Logger;

  constructor(@inject(IntlServiceToken) intl: IntlService, @inject(LoggingServiceToken) logging: LoggingService) {
    super(UrlShortenerProviderName.DaGd, intl);

    this.logger = logging.getLogger('DaGdUrlShortenerProvider');
  }

  isDataValid(): boolean {
    return true;
  }

  async shorten(url: URL): Promise<string> {
    const urlString = url.toString();

    this.logger.trace(`Shortening URL via da.gd:`, urlString);

    const response = await fetch(`https://da.gd/shorten?url=${encodeURIComponent(urlString)}`, {
      headers: { Accept: 'text/plain' },
    });

    let body: string | undefined;
    if (!response.ok) {
      if (this.logger.isLevelEnabled(LogLevel.Error)) {
        try {
          body = await response.text();
        } catch (_) {
          // Do nothing
        }

        this.logger.error(`Failed to shorten URL via da.gd:`, { body, status: response.status, url: urlString });
      }

      throw this.createExtensionError('SHO500000');
    } else {
      // da.gd's success response is the shortened URL as plain text (with a trailing newline), not JSON
      body = (await response.text()).trim();
    }

    return this.extractShortUrl(body, 'da.gd');
  }
}

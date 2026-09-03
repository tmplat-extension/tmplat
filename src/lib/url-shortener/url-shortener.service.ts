import { isString } from 'es-toolkit';
import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  type UrlShortenerDataRepository,
  UrlShortenerDataRepositoryToken,
} from 'extension/url-shortener/data/url-shortener-data.repository';
import { type UrlShortenerDataProvider } from 'extension/url-shortener/data/url-shortener-data.schema';
import {
  type UrlShortenerProvider,
  UrlShortenerProviderToken,
} from 'extension/url-shortener/provider/url-shortener.provider';

const UrlShortenerServiceName = 'UrlShortenerService';

export const UrlShortenerServiceToken = Symbol(UrlShortenerServiceName);

@injectable()
export class UrlShortenerService {
  private readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @multiInject(UrlShortenerProviderToken)
    private readonly providers: UrlShortenerProvider<UrlShortenerDataProvider>[],
    @inject(UrlShortenerDataRepositoryToken) private readonly repository: UrlShortenerDataRepository,
  ) {
    this.logger = logging.getLogger(UrlShortenerServiceName);
  }

  async shorten(url: string | URL): Promise<string> {
    this.logger.trace(`Generating short URL for long URL:`, url);

    if (isString(url)) {
      try {
        url = new URL(url);
      } catch (e) {
        throw ExtensionError.fromCause(e, 'SHO422000');
      }
    }

    const data = await this.repository.get();
    const providerName = data.provider;
    const providerIntlName = this.intl.getMessage(`url_shortener_name_${providerName}`);
    const providerData = data.providers[providerName];

    const provider = this.providers.find((p) => p.name === providerName);
    if (!provider) {
      throw ExtensionError.from('SHO404000', providerIntlName);
    }

    if (!(await provider.isDataValid(providerData))) {
      throw ExtensionError.from('SHO404100', providerIntlName);
    }

    try {
      // TODO: Track for analytics?
      return await provider.shorten(url, providerData);
    } catch (e) {
      if (this.logger.isLevelEnabled(LogLevel.Error)) {
        this.logger.error(`Failed to shorten URL:`, url.toString(), e);
      }

      throw ExtensionError.fallback(e, 'SHO500000', providerIntlName);
    }
  }
}

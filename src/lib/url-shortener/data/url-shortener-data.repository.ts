import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { type UrlShortenerData, UrlShortenerDataSchema } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

const UrlShortenerDataRepositoryName = 'UrlShortenerDataRepository';

export const UrlShortenerDataRepositoryToken = Symbol(UrlShortenerDataRepositoryName);

@injectable()
export class UrlShortenerDataRepository
  extends RequiredDataRepository<typeof UrlShortenerDataSchema, UrlShortenerData>
  implements DataInstaller
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    // Bitly's token and any YOURLS credentials are stored alongside the provider selection, so this deliberately
    // uses local (device-only) storage rather than sync
    super({
      dataStorage: dataService.local,
      logger: logging.getLogger(UrlShortenerDataRepositoryName),
      namespace: DataNamespace.UrlShortener,
      schema: UrlShortenerDataSchema,
      validationService,
    });
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      // spoo.me requires no configuration or authentication and has generous anonymous rate limits, making it the
      // best default for a user who has not yet made an explicit choice
      provider: UrlShortenerProviderName.SpooMe,
      providers: {
        [UrlShortenerProviderName.Bitly]: {},
        [UrlShortenerProviderName.DaGd]: {},
        [UrlShortenerProviderName.SpooMe]: {},
        [UrlShortenerProviderName.Yourls]: {
          authenticationMode: null,
          url: null,
          username: null,
          password: null,
          signature: null,
        },
      },
    }));
  }
}

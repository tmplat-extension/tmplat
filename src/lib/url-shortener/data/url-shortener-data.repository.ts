import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { UrlShortenerData } from 'extension/url-shortener/data/url-shortener-data.model';
import { urlShortenerDataSchema } from 'extension/url-shortener/data/url-shortener-data.schema';

export const UrlShortenerDataRepositoryToken = Symbol('UrlShortenerDataRepository');

@injectable()
export class UrlShortenerDataRepository extends DataRepository<UrlShortenerData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.UrlShortener, urlShortenerDataSchema, dataService.sync);
  }

  async install(): Promise<void> {
    await this.set({
      providers: {
        bitly: {
          enabled: true,
        },
        yourls: {
          authenticationMode: null,
          enabled: false,
          signature: null,
          url: null,
          username: null,
          password: null,
        },
      },
    });
  }

  isInstalled(): Promise<boolean> {
    return this.isNotEmpty();
  }
}

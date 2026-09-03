import { BrowserDataStorage, type BrowserDataStorageName, type DataStorage } from 'extension/common/data/data-storage';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { getOrInsertComputed } from 'extension/common/map.utils';

export const DataServiceToken = Symbol('DataService');

@injectable()
export class DataService {
  private readonly cache = new Map<BrowserDataStorageName, BrowserDataStorage>();

  constructor(@inject(LoggingServiceToken) private readonly logging: LoggingService) {}

  private getCachedDataStorage(name: BrowserDataStorageName): BrowserDataStorage {
    return getOrInsertComputed(this.cache, name, () => new BrowserDataStorage(name, this.logging));
  }

  get local(): DataStorage {
    return this.getCachedDataStorage('local');
  }

  get managed(): DataStorage {
    return this.getCachedDataStorage('managed');
  }

  get session(): DataStorage {
    return this.getCachedDataStorage('session');
  }

  get sync(): DataStorage {
    return this.getCachedDataStorage('sync');
  }
}

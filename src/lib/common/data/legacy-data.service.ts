import { type DataStorage, DomDataStorage, type DomDataStorageName } from 'extension/common/data/data-storage';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { getOrInsertComputed } from 'extension/common/map.utils';

export const LegacyDataServiceToken = Symbol('LegacyDataService');

@injectable()
export class LegacyDataService {
  private readonly cache = new Map<DomDataStorageName, DomDataStorage>();

  constructor(@inject(LoggingServiceToken) private readonly logging: LoggingService) {}

  private getCachedDataStorage(name: DomDataStorageName): DomDataStorage {
    return getOrInsertComputed(this.cache, name, () => new DomDataStorage(name, this.logging));
  }

  get local(): DataStorage {
    return this.getCachedDataStorage('localStorage');
  }

  get session(): DataStorage {
    return this.getCachedDataStorage('sessionStorage');
  }
}

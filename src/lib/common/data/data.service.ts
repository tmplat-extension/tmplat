import { ChromeDataStorage, DataStorage } from 'extension/common/data/data-storage';
import { injectable } from 'extension/common/di';

export const DataServiceToken = Symbol('DataService');

@injectable()
export class DataService {
  readonly local: DataStorage = ChromeDataStorage.forLocal();
  readonly sync: DataStorage = ChromeDataStorage.forSync();
}

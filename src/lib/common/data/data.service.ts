import { BrowserDataStorage, DataStorage } from 'extension/common/data/data-storage';
import { injectable } from 'extension/common/di';

export const DataServiceToken = Symbol('DataService');

@injectable()
export class DataService {
  readonly local: DataStorage = BrowserDataStorage.forLocal();
  readonly sync: DataStorage = BrowserDataStorage.forSync();
}

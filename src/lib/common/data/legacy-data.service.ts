import { DataStorage, DomDataStorage } from 'extension/common/data/data-storage';
import { injectable } from 'extension/common/di';

export const LegacyDataServiceToken = Symbol('LegacyDataService');

@injectable()
export class LegacyDataService {
  readonly local: DataStorage = DomDataStorage.forLocal();
}

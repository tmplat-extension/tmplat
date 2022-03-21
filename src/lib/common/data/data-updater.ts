import { DataUpdateContext } from 'extension/common/data/data-update-context.model';

export const DataUpdaterToken = Symbol('DataUpdater');

export interface DataUpdater {
  update(context: DataUpdateContext): Promise<void>;
}

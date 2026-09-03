import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';

export const DataUpdaterToken = Symbol('DataUpdater');

export interface DataUpdater {
  readonly namespace: DataNamespace;

  update(context: DataUpdateContext): Promise<boolean>;
}

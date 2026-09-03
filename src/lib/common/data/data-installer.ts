import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataNamespace } from 'extension/common/data/data-namespace.enum';

export const DataInstallerToken = Symbol('DataInstaller');

export interface DataInstaller {
  readonly namespace: DataNamespace;

  install(context: DataInstallContext): Promise<boolean>;
}

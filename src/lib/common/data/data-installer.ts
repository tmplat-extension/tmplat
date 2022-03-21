import { DataInstallContext } from 'extension/common/data/data-install-context.model';

export const DataInstallerToken = Symbol('DataInstaller');

export interface DataInstaller {
  install(context: DataInstallContext): Promise<void>;

  isInstalled(context: DataInstallContext): Promise<boolean>;
}

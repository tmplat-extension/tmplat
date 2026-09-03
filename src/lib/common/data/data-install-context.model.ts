import { type DataService } from 'extension/common/data/data.service';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';

export type DataInstallContext = {
  readonly dataService: DataService;
  readonly extensionInfo: ExtensionInfo;
  readonly version: ExtensionVersion;
};

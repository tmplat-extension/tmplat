import { DataService } from 'extension/common/data/data.service';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

export type DataInstallContext = {
  readonly dataService: DataService;
  readonly version: ExtensionVersion;
};

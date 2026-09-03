import { DataService } from 'extension/common/data/data.service';
import { ExtensionInfo } from 'extension/common/extension-info';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

export type DataUpdateContext = {
  readonly dataService: DataService;
  readonly extensionInfo: ExtensionInfo;
  readonly newVersion: ExtensionVersion;
  readonly oldVersion: ExtensionVersion;
};

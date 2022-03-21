import { DataService } from 'extension/common/data/data.service';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

export type DataUpdateContext = {
  readonly dataService: DataService;
  readonly newVersion: ExtensionVersion;
  readonly oldVersion: ExtensionVersion;
};

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { DataMigrator } from 'extension/common/data/migration/data-migrator';
import { injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

@injectable()
export class CommonDataMigrator implements DataMigrator {
  readonly namespace = DataNamespace.Common;

  isRequired(oldVersion: ExtensionVersion): boolean {
    return oldVersion === ExtensionVersion.V1_2_9;
  }

  async migrate({ legacyDataService, oldVersion }: DataMigrationContext): Promise<void> {
    if (oldVersion === ExtensionVersion.V1_2_9) {
      await legacyDataService.local.removeAll(['options_active_tab', 'options_limit', 'stats', 'updates']);
    }
  }
}

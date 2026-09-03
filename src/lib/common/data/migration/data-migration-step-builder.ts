import { type DataRepository } from 'extension/common/data/data.repository';
import {
  type DataMigrationContext,
  type DataMigrationStep,
} from 'extension/common/data/migration/data-migration.model';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';

export class DataMigrationStepBuilder {
  createSimpleStepForRemoval(
    targetOldVersion: ExtensionVersion,
    descriptionKey: IntlMessageKey,
    legacyDataKeys: string[],
  ): DataMigrationStep {
    return {
      descriptionKey,
      async isRequired({ legacyDataService, oldVersion }: DataMigrationContext): Promise<boolean> {
        return oldVersion === targetOldVersion && (await legacyDataService.local.hasAny(legacyDataKeys));
      },
      async migrate({ legacyDataService }: DataMigrationContext) {
        await legacyDataService.local.removeAll(legacyDataKeys);
      },
    };
  }

  createSimpleStepForTransfer<Data>(
    targetOldVersion: ExtensionVersion,
    descriptionKey: IntlMessageKey,
    legacyDataKey: string,
    repository: DataRepository<Data>,
    mutator: (data: Data, legacyData: unknown) => void,
  ): DataMigrationStep {
    return {
      descriptionKey,
      async isRequired({ legacyDataService, oldVersion }: DataMigrationContext): Promise<boolean> {
        return oldVersion === targetOldVersion && (await legacyDataService.local.has(legacyDataKey));
      },
      async migrate({ legacyDataService }: DataMigrationContext) {
        const legacyData = await legacyDataService.local.get(legacyDataKey);

        await repository.mutate((data) => {
          mutator(data, legacyData);
          return data;
        });

        await legacyDataService.local.remove(legacyDataKey);
      },
    };
  }
}

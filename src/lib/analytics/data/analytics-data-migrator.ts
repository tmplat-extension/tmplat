import { isBoolean } from 'lodash-es';

import {
  AnalyticsDataRepository,
  AnalyticsDataRepositoryToken,
} from 'extension/analytics/data/analytics-data.repository';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { DataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

@injectable()
export class AnalyticsDataMigrator implements DataMigrator {
  readonly namespace = DataNamespace.Analytics;

  constructor(@inject(AnalyticsDataRepositoryToken) private readonly repository: AnalyticsDataRepository) {}

  isRequired(oldVersion: ExtensionVersion): boolean {
    return oldVersion === ExtensionVersion.V1_2_9;
  }

  async migrate({ legacyDataService, oldVersion }: DataMigrationContext): Promise<void> {
    if (oldVersion === ExtensionVersion.V1_2_9) {
      const legacyData = await legacyDataService.local.get('analytics');

      await this.repository.modify((data) => {
        if (isBoolean(legacyData)) {
          data.enabled = legacyData;
        }

        return data;
      });

      await legacyDataService.local.remove('analytics');
    }
  }
}

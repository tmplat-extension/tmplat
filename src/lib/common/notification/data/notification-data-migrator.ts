import { isBoolean, isPlainObject } from 'lodash-es';

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { DataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import {
  NotificationDataRepository,
  NotificationDataRepositoryToken,
} from 'extension/common/notification/data/notification-data.repository';

@injectable()
export class NotificationDataMigrator implements DataMigrator {
  readonly namespace = DataNamespace.Notification;

  constructor(@inject(NotificationDataRepositoryToken) private readonly repository: NotificationDataRepository) {}

  isRequired(oldVersion: ExtensionVersion): boolean {
    return oldVersion === ExtensionVersion.V1_2_9;
  }

  async migrate({ legacyDataService, oldVersion }: DataMigrationContext): Promise<void> {
    if (oldVersion === ExtensionVersion.V1_2_9) {
      const legacyData = await legacyDataService.local.get('notifications');

      await this.repository.modify((data) => {
        if (isPlainObject(legacyData) && isBoolean(legacyData.enabled)) {
          data.enabled = legacyData.enabled;
        }

        return data;
      });

      await legacyDataService.local.remove('notifications');
    }
  }
}

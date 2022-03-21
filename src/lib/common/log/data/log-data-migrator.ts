import { isBoolean } from 'lodash-es';

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { DataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { isEnumNumberValue } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { LogDataRepository, LogDataRepositoryToken } from 'extension/common/log/data/log-data.repository';
import { LogLevel } from 'extension/common/log/log-level.enum';

@injectable()
export class LogDataMigrator implements DataMigrator {
  readonly namespace = DataNamespace.Log;

  constructor(@inject(LogDataRepositoryToken) private readonly repository: LogDataRepository) {}

  isRequired(oldVersion: ExtensionVersion): boolean {
    return oldVersion === ExtensionVersion.V1_2_9;
  }

  async migrate({ legacyDataService, oldVersion }: DataMigrationContext): Promise<void> {
    if (oldVersion === ExtensionVersion.V1_2_9) {
      const legacyData = await legacyDataService.local.get('logger');

      await this.repository.modify((data) => {
        if (legacyData != null) {
          if (isBoolean(legacyData.enabled)) {
            data.enabled = legacyData.enabled;
          }
          if (isEnumNumberValue(LogLevel, legacyData.level)) {
            data.level = LogDataMigrator.getMigratedLogLevel(legacyData.level);
          }
        }

        return data;
      });

      await legacyDataService.local.remove('logger');
    }
  }

  private static getMigratedLogLevel(legacyLogLevel: LogLevel): LogLevel {
    switch (legacyLogLevel) {
      case LogLevel.Debug:
        return LogLevel.Info;
      case LogLevel.Info:
        return LogLevel.Debug;
      default:
        return legacyLogLevel;
    }
  }
}

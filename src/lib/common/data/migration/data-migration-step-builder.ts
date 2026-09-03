import { type z } from 'zod';
import { type DataRepository } from 'extension/common/data/data.repository';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import {
  type DataMigrationContext,
  type DataMigrationStep,
  type DataMigrationStepResultDetail,
  type LegacyDataStorageName,
} from 'extension/common/data/migration/data-migration.model';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Logger } from 'extension/common/logging/logger';

export class DataMigrationStepBuilder {
  constructor(private readonly logger: Logger) {}

  createSimpleStepForRemoval(
    targetOldVersion: ExtensionVersion,
    descriptionKey: IntlMessageKey,
    legacyData: DataMigrationStepBuilderRemovalLegacyData,
  ): DataMigrationStep {
    const { keys, storage } = legacyData;
    const { logger } = this;

    return {
      descriptionKey,
      async isRequired({ legacyDataService, oldVersion }: DataMigrationContext): Promise<boolean> {
        return oldVersion === targetOldVersion && (await legacyDataService[storage].hasAny(keys));
      },
      async migrate({ legacyDataService, oldVersion, newVersion }: DataMigrationContext) {
        logger.debug('Removing legacy data for migration step', { keys, oldVersion, newVersion, storage });

        await legacyDataService[storage].removeAll(keys);

        logger.info('Removed legacy data for migration step', { keys, oldVersion, newVersion, storage });
      },
    };
  }

  createSimpleStepForTransfer<Data, Schema extends z.ZodType = z.ZodType>(
    targetOldVersion: ExtensionVersion,
    descriptionKey: IntlMessageKey,
    legacyData: DataMigrationStepBuilderTransferLegacyData<Schema>,
    repository: DataRepository<Data>,
    mutator: (
      data: Data,
      legacyData: z.output<Schema>,
      context: DataMigrationContext,
    ) => void | DataMigrationStepResultDetail,
  ): DataMigrationStep {
    const { key, schema, storage } = legacyData;
    const { logger } = this;

    return {
      descriptionKey,
      async isRequired({ legacyDataService, oldVersion }: DataMigrationContext): Promise<boolean> {
        return oldVersion === targetOldVersion && (await legacyDataService[storage].has(key));
      },
      async migrate(context: DataMigrationContext) {
        const { legacyDataService, oldVersion, newVersion, validationService } = context;

        logger.debug('Transferring legacy data for migration step', { key, oldVersion, newVersion, storage });

        const rawLegacyData = await legacyDataService[storage].get(key);
        const migratableLegacyData: z.output<Schema> = schema
          ? validationService.validateSchema(rawLegacyData, schema, {
              code: 'MIG422000',
              parentLogger: logger,
              parentPath: [key],
            })
          : (rawLegacyData as z.output<Schema>);

        let result: DataMigrationStepResultDetail | void = undefined;
        const saved = await repository.mutate((data, cancel) => {
          result = mutator(data, migratableLegacyData, context);
          if (result && result.outcome !== DataMigrationStepOutcome.Passed) {
            cancel();
          }

          return data;
        });

        if (saved) {
          await legacyDataService[storage].remove(key);

          logger.info('Transferred legacy data for migration step', { key, oldVersion, newVersion, storage });
        } else {
          logger.warn('Cancelled transfer of legacy data for migration step', { key, oldVersion, newVersion, storage });
        }

        return result;
      },
    };
  }
}

export type DataMigrationStepBuilderRemovalLegacyData = {
  keys: string[];
  storage: LegacyDataStorageName;
};

export type DataMigrationStepBuilderTransferLegacyData<Schema extends z.ZodType = z.ZodType> = {
  key: string;
  schema?: Schema;
  storage: LegacyDataStorageName;
};

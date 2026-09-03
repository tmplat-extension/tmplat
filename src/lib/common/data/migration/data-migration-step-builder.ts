import { type z } from 'zod';
import { type DataRepository } from 'extension/common/data/data.repository';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import {
  type DataMigrationContext,
  type DataMigrationStep,
  type DataMigrationStepLegacyData,
  type DataMigrationStepResultDetail,
  type LegacyDataStorageName,
} from 'extension/common/data/migration/data-migration.model';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Logger } from 'extension/common/logging/logger';

/**
 * Clones legacy data so that it can be safely reported back for a failed migration step, falling back to `undefined`
 * where the data cannot be cloned.
 */
function cloneLegacyData(
  key: string,
  storage: LegacyDataStorageName,
  data: unknown,
  logger: Logger,
): DataMigrationStepLegacyData {
  try {
    return { data: structuredClone(data), key, storage };
  } catch (e) {
    logger.warn('Unable to clone legacy data for migration step', e, { key, storage });

    return { data: undefined, key, storage };
  }
}

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
      async migrate({
        legacyDataService,
        oldVersion,
        newVersion,
      }: DataMigrationContext): Promise<void | DataMigrationStepResultDetail> {
        logger.debug('Removing legacy data for migration step', { keys, oldVersion, newVersion, storage });

        const legacyStorage = legacyDataService[storage];
        const rawLegacyData = await legacyStorage.getAny(keys);
        const legacy = Object.entries(rawLegacyData).map(([legacyKey, data]) =>
          cloneLegacyData(legacyKey, storage, data, logger),
        );

        try {
          await legacyStorage.removeAll(keys);
        } catch (e) {
          return {
            errors: [ExtensionError.fallback(e, 'MIG500000')] as [ExtensionError, ...ExtensionError[]],
            legacy,
            outcome: DataMigrationStepOutcome.Failed,
          };
        }

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
      async migrate(context: DataMigrationContext): Promise<void | DataMigrationStepResultDetail> {
        const { legacyDataService, oldVersion, newVersion, validationService } = context;

        logger.debug('Transferring legacy data for migration step', { key, oldVersion, newVersion, storage });

        const rawLegacyData = await legacyDataService[storage].get(key);
        // Cloned up front as the mutator is given the raw legacy data when no schema is supplied, so it could
        // otherwise mutate what's reported back for a failed step
        const legacy = [cloneLegacyData(key, storage, rawLegacyData, logger)];

        try {
          const migratableLegacyData: z.output<Schema> = schema
            ? validationService.validateSchema(rawLegacyData, schema, {
                code: 'MIG422000',
                parentLogger: logger,
                parentPath: [key],
              })
            : (rawLegacyData as z.output<Schema>);

          const mutation: { result?: DataMigrationStepResultDetail } = {};
          const saved = await repository.mutate((data, cancel) => {
            const result = mutator(data, migratableLegacyData, context) || undefined;
            mutation.result = result;
            if (result && result.outcome !== DataMigrationStepOutcome.Passed) {
              cancel();
            }

            return data;
          });

          if (saved) {
            await legacyDataService[storage].remove(key);

            logger.info('Transferred legacy data for migration step', { key, oldVersion, newVersion, storage });
          } else {
            logger.warn('Cancelled transfer of legacy data for migration step', {
              key,
              oldVersion,
              newVersion,
              storage,
            });
          }

          const { result } = mutation;

          return result?.outcome === DataMigrationStepOutcome.Failed && result.legacy === undefined
            ? { ...result, legacy }
            : result;
        } catch (e) {
          return {
            errors: [ExtensionError.fallback(e, 'MIG500000')] as [ExtensionError, ...ExtensionError[]],
            legacy,
            outcome: DataMigrationStepOutcome.Failed,
          };
        }
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

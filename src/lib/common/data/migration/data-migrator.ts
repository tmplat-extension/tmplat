import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import {
  DataMigrationContext,
  DataMigrationStep,
  DataMigrationStepResult,
} from 'extension/common/data/migration/data-migration.model';
import { ExtensionError } from 'extension/common/extension-error';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { IntlService } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';

export const DataMigratorToken = Symbol('DataMigrator');

export interface DataMigrator {
  readonly namespace: DataNamespace;
  readonly namespaceTitle: string;

  getRequiredMigrationSteps(context: DataMigrationContext): Promise<string[]>;

  isMigrationRequired(context: DataMigrationContext): Promise<boolean>;

  migrate(context: DataMigrationContext): Promise<DataMigrationStepResult[]>;
}

export abstract class AbstractDataMigrator implements DataMigrator {
  readonly namespaceTitle: string;

  protected abstract readonly logger: Logger;

  protected constructor(
    readonly namespace: DataNamespace,
    namespaceTitleKey: IntlMessageKey,
    private readonly intl: IntlService,
    private readonly steps: DataMigrationStep[],
  ) {
    this.namespaceTitle = this.intl.getMessage(namespaceTitleKey);
  }

  async getRequiredMigrationSteps(context: DataMigrationContext): Promise<string[]> {
    const steps = await this.filterRequiredSteps(context);
    return steps.map((step) => this.intl.getMessage(step.descriptionKey));
  }

  async isMigrationRequired(context: DataMigrationContext): Promise<boolean> {
    const steps = await this.filterRequiredSteps(context);
    return steps.length > 0;
  }

  async migrate(context: DataMigrationContext): Promise<DataMigrationStepResult[]> {
    const results: DataMigrationStepResult[] = [];
    const steps = await this.filterRequiredSteps(context);

    for (const step of steps) {
      results.push(await this.migrateStep(context, step));
    }

    return results;
  }

  private async filterRequiredSteps(context: DataMigrationContext): Promise<DataMigrationStep[]> {
    const checks = await Promise.all(
      this.steps.map(async (step) => ({ required: await step.isRequired(context), step })),
    );

    return checks.reduce((acc, check) => {
      if (check.required) {
        acc.push(check.step);
      }
      return acc;
    }, [] as DataMigrationStep[]);
  }

  private async migrateStep(context: DataMigrationContext, step: DataMigrationStep): Promise<DataMigrationStepResult> {
    const description = this.intl.getMessage(step.descriptionKey);

    try {
      await step.migrate(context);

      this.logger.info(
        `Completed '${description}' migration step of '${this.namespace}' namespace from v${context.oldVersion} to v${context.newVersion}:`,
      );

      return {
        description,
        outcome: DataMigrationOutcome.Passed,
      };
    } catch (error) {
      this.logger.error(
        `Failed '${description}' migration step of '${this.namespace}' namespace from v${context.oldVersion} to v${context.newVersion}:`,
        error,
      );

      // TODO: Localise fallback reason
      return {
        description,
        outcome: DataMigrationOutcome.Failed,
        reason: error instanceof ExtensionError ? error.message : 'Migration step failed',
      };
    }
  }

  protected static createSimpleStepForRemoval(
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

  protected static createSimpleStepForTransfer<Data>(
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

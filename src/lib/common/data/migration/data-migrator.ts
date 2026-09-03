import { allFulfilled } from 'allfulfilled';
import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import {
  type DataMigrationContext,
  type DataMigrationStep,
  type DataMigrationStepResult,
} from 'extension/common/data/migration/data-migration.model';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';

export const DataMigratorToken = Symbol('DataMigrator');

export interface DataMigrator {
  readonly namespace: DataNamespace;
  readonly namespaceTitle: string;

  getRequiredMigrationSteps(context: DataMigrationContext): Promise<string[]>;

  isMigrationRequired(context: DataMigrationContext): Promise<boolean>;

  migrate(context: DataMigrationContext): Promise<DataMigrationStepResult[]>;
}

export abstract class AbstractDataMigrator implements DataMigrator {
  private readonly intl: IntlService;
  protected readonly logger: Logger;
  readonly namespace: DataNamespace;
  readonly namespaceTitle: string;

  protected constructor(options: AbstractDataMigratorOptions) {
    this.intl = options.intl;
    this.logger = options.logger;
    this.namespace = options.namespace;
    this.namespaceTitle = options.intl.getMessage(`data_namespace_${this.namespace}`);
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
    const steps = await this.filterRequiredSteps(context);
    return allFulfilled(steps.map((step) => this.migrateStep(context, step)));
  }

  protected abstract getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[];

  private async filterRequiredSteps(context: DataMigrationContext): Promise<DataMigrationStep[]> {
    const steps = this.getSteps(new DataMigrationStepBuilder());
    const checks = await allFulfilled(steps.map(async (step) => ({ required: await step.isRequired(context), step })));

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

      return {
        description,
        outcome: DataMigrationOutcome.Failed,
        reason: ExtensionError.fallback(error, 'MIG500000').message,
      };
    }
  }
}

export type AbstractDataMigratorOptions = {
  intl: IntlService;
  logger: Logger;
  namespace: DataNamespace;
};

import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
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
    const descriptions: string[] = [];

    for await (const step of this.filterRequiredSteps(context)) {
      descriptions.push(this.intl.getMessage(step.descriptionKey));
    }

    return descriptions;
  }

  async isMigrationRequired(context: DataMigrationContext): Promise<boolean> {
    const { done } = await this.filterRequiredSteps(context).next();
    return !done;
  }

  async migrate(context: DataMigrationContext): Promise<DataMigrationStepResult[]> {
    const results: DataMigrationStepResult[] = [];

    for await (const { required, step } of this.checkRequirements(context)) {
      const result = await this.migrateStep(context, step, required);
      results.push(result);
    }

    return results;
  }

  protected abstract getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[];

  private async *checkRequirements(
    context: DataMigrationContext,
  ): AsyncIterableIterator<{ required: boolean; step: DataMigrationStep }> {
    const steps = this.getSteps(new DataMigrationStepBuilder(this.logger));

    for await (const step of steps) {
      yield { required: await step.isRequired(context), step };
    }
  }

  private async *filterRequiredSteps(context: DataMigrationContext): AsyncIterableIterator<DataMigrationStep> {
    for await (const check of this.checkRequirements(context)) {
      if (check.required) {
        yield check.step;
      }
    }
  }

  private async migrateStep(
    context: DataMigrationContext,
    step: DataMigrationStep,
    required: boolean,
  ): Promise<DataMigrationStepResult> {
    const description = this.intl.getMessage(step.descriptionKey);
    if (!required) {
      const reasons: [string] = [this.intl.getMessage('data_migration_step_skipped_reason')];

      this.logger.warn(
        `Skipped '${description}' migration step of '${this.namespace}' namespace from v${context.oldVersion} to v${context.newVersion}:`,
        reasons,
      );

      return {
        description,
        outcome: DataMigrationStepOutcome.Skipped,
        reasons,
      };
    }

    try {
      const result = await step.migrate(context);
      if (result?.outcome === DataMigrationStepOutcome.Skipped) {
        const reasons = Array.from(new Set(result.reasons)).toSorted((a, b) => a.localeCompare(b)) as [
          string,
          ...string[],
        ];

        this.logger.warn(
          `Skipped '${description}' migration step of '${this.namespace}' namespace from v${context.oldVersion} to v${context.newVersion}:`,
          reasons,
        );

        return {
          description,
          outcome: DataMigrationStepOutcome.Skipped,
          reasons,
        };
      }

      if (result?.outcome === DataMigrationStepOutcome.Failed) {
        this.logger.error(
          `Failed '${description}' migration step of '${this.namespace}' namespace from v${context.oldVersion} to v${context.newVersion}:`,
          ...result.errors,
        );

        return {
          description,
          outcome: DataMigrationStepOutcome.Failed,
          errors: result.errors,
        };
      }

      this.logger.info(
        `Completed '${description}' migration step of '${this.namespace}' namespace from v${context.oldVersion} to v${context.newVersion}`,
      );

      return {
        description,
        outcome: DataMigrationStepOutcome.Passed,
      };
    } catch (error) {
      this.logger.error(
        `Failed '${description}' migration step of '${this.namespace}' namespace from v${context.oldVersion} to v${context.newVersion}:`,
        error,
      );

      return {
        description,
        errors: [ExtensionError.fallback(error, 'MIG500000')],
        outcome: DataMigrationStepOutcome.Failed,
      };
    }
  }
}

export type AbstractDataMigratorOptions = {
  intl: IntlService;
  logger: Logger;
  namespace: DataNamespace;
};

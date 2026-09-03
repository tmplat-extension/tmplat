import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { type LegacyDataService, LegacyDataServiceToken } from 'extension/common/data/legacy-data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationResult } from 'extension/common/data/migration/data-migration.model';
import {
  type DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import { type DataMigrator, DataMigratorToken } from 'extension/common/data/migration/data-migrator';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';

const versionQueryParam = 'version';

const DataMigrationManagerName = 'DataMigrationManager';

export const DataMigrationManagerToken = Symbol(DataMigrationManagerName);

@injectable()
export class DataMigrationManager {
  private readonly logger: Logger;

  constructor(
    @inject(DataServiceToken) private readonly dataService: DataService,
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(LegacyDataServiceToken) private readonly legacyDataService: LegacyDataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @multiInject(DataMigratorToken) private readonly migrators: DataMigrator[],
    @inject(ValidationServiceToken) private readonly validationService: ValidationService,
  ) {
    this.logger = logging.getLogger(DataMigrationManagerName);
  }

  async migrate(version = this.getVersion()): Promise<DataMigrationManagerMigrateResult> {
    const currentVersion = this.extensionInfo.getVersion();

    if (!(await this.dataMigrationService.isMigrationRequired(version))) {
      throw ExtensionError.from('MIG409000', version, currentVersion);
    }

    const results: DataMigrationResult[] = [];

    if (await this.dataMigrationService.advanceMigrationPhase(version, MigrationPhase.Started)) {
      this.logger.info(`Migrating extension from v${version}`);

      results.push(
        ...(await Promise.all(
          this.migrators.map(async (migrator) => this.executeMigrator(migrator, version, currentVersion)),
        )),
      );
    } else {
      results.push(...this.generateUnknownResults());
    }

    await this.dataMigrationService.advanceMigrationPhase(version, MigrationPhase.Completed);

    this.logger.info(`Completed extension migration from v${version}`);

    return { results, version };
  }

  get namespaces(): DataNamespace[] {
    return this.migrators.map((migrator) => migrator.namespace);
  }

  private async executeMigrator(
    migrator: DataMigrator,
    oldVersion: ExtensionVersion,
    newVersion: ExtensionVersion,
  ): Promise<DataMigrationResult> {
    const { namespace } = migrator;

    try {
      const steps = await migrator.migrate({
        dataService: this.dataService,
        legacyDataService: this.legacyDataService,
        oldVersion,
        newVersion,
        validationService: this.validationService,
      });
      const counts = steps.reduce(
        (acc, step) => {
          acc[step.outcome]++;
          return acc;
        },
        {
          [DataMigrationStepOutcome.Failed]: 0,
          [DataMigrationStepOutcome.Passed]: 0,
          [DataMigrationStepOutcome.Skipped]: 0,
        } as Record<DataMigrationStepOutcome, number>,
      );

      if (steps.length) {
        this.logger.info(
          `All migration steps completed while migrating '${namespace}' namespace from v${oldVersion} to v${newVersion}`,
          { ...counts, total: steps.length },
        );
      } else {
        this.logger.warn(
          `No migration steps were executed while migrating '${namespace}' namespace from v${oldVersion} to v${newVersion}`,
        );
      }

      return {
        namespace,
        outcome: DataMigrationOutcome.Completed,
        steps,
      };
    } catch (e) {
      this.logger.error(`Failed migration of '${namespace}' namespace from v${oldVersion} to v${newVersion}:`, e);

      return {
        namespace,
        outcome: DataMigrationOutcome.Failed,
        error: ExtensionError.fallback(e, 'MIG500000'),
      };
    }
  }

  private generateUnknownResults(): DataMigrationResult[] {
    return this.namespaces.map((namespace) => ({
      namespace,
      outcome: DataMigrationOutcome.Unknown,
    }));
  }

  private getVersion(): ExtensionVersion {
    const url = new URL(document.documentURI);
    const version = url.searchParams.get(versionQueryParam);
    if (!version) {
      throw ExtensionError.from('MIG404000', versionQueryParam);
    }

    return this.extensionInfo.convertStringToExtensionVersion(version);
  }
}

export type DataMigrationManagerMigrateResult = {
  results: DataMigrationResult[];
  version: ExtensionVersion;
};

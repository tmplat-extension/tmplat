import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type LegacyDataService, LegacyDataServiceToken } from 'extension/common/data/legacy-data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
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
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

const versionQueryParam = 'version';

const DataMigrationManagerName = 'DataMigrationManager';

export const DataMigrationManagerToken = Symbol(DataMigrationManagerName);

@injectable()
export class DataMigrationManager {
  private readonly logger: Logger;

  constructor(
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LegacyDataServiceToken) private readonly legacyDataService: LegacyDataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @multiInject(DataMigratorToken) private readonly migrators: DataMigrator[],
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
        legacyDataService: this.legacyDataService,
        oldVersion,
        newVersion,
      });
      let failedCount = 0;
      let passedCount = 0;

      for (const step of steps) {
        if (step.outcome === DataMigrationOutcome.Passed) {
          passedCount++;
        } else {
          failedCount++;
        }
      }

      if (failedCount) {
        this.logger.warn(
          `${failedCount} migration step(s) failed while migrating '${namespace}' namespace from v${oldVersion} to v${newVersion}`,
        );

        return {
          namespace,
          outcome: DataMigrationOutcome.Failed,
          reason: this.intl.getMessage('data_migration_failed_reason'),
          steps,
        };
      }

      if (passedCount) {
        this.logger.info(
          `${passedCount} migration step(s) passed while migrating '${namespace}' namespace from v${oldVersion} to v${newVersion}`,
        );

        return {
          namespace,
          outcome: DataMigrationOutcome.Passed,
          steps,
        };
      }

      this.logger.info(`Skipping migration of '${namespace}' namespace from v${oldVersion} to v${newVersion}`);

      return {
        namespace,
        outcome: DataMigrationOutcome.Skipped,
        reason: this.intl.getMessage('data_migration_skipped_reason'),
        steps,
      };
    } catch (e) {
      this.logger.error(`Failed migration of '${namespace}' namespace from v${oldVersion} to v${newVersion}:`, e);

      return {
        namespace,
        outcome: DataMigrationOutcome.Failed,
        reason: ExtensionError.fallback(e, 'MIG500000').message,
        steps: [],
      };
    }
  }

  private generateUnknownResults(): DataMigrationResult[] {
    return this.namespaces.map((namespace) => ({
      namespace,
      outcome: DataMigrationOutcome.Unknown,
      steps: [],
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

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { LegacyDataService, LegacyDataServiceToken } from 'extension/common/data/legacy-data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationResult } from 'extension/common/data/migration/data-migration.model';
import {
  DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import { DataMigrator, DataMigratorToken } from 'extension/common/data/migration/data-migrator';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { Logger } from 'extension/common/log/logger';

const DataMigrationManagerName = 'DataMigrationManager';

export const DataMigrationManagerToken = Symbol(DataMigrationManagerName);

@injectable()
export class DataMigrationManager {
  private readonly logger: Logger;

  constructor(
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(LegacyDataServiceToken) private readonly legacyDataService: LegacyDataService,
    @inject(LogServiceToken) logService: LogService,
    @multiInject(DataMigratorToken) private readonly migrators: DataMigrator[],
  ) {
    this.logger = logService.createLogger(DataMigrationManagerName);
  }

  async migrate(version = this.getVersion()): Promise<DataMigrationManagerMigrateResult> {
    const currentVersion = this.extensionInfo.version;

    if (await this.dataMigrationService.isMigrationRequired(version)) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`Could not migrate from version '${version}' to version '${currentVersion}'`);
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

    if (!migrator.isRequired(oldVersion, newVersion)) {
      this.logger.debug(`Skipping migration of '${namespace}' namespace from v${oldVersion} to v${newVersion}`);

      // TODO: Localise reason
      return {
        namespace,
        outcome: DataMigrationOutcome.Skipped,
        reason: 'Migration not required',
      };
    }

    try {
      await migrator.migrate({
        legacyDataService: this.legacyDataService,
        oldVersion,
        newVersion,
      });

      this.logger.debug(`Migrated '${namespace}' namespace from v${oldVersion} to v${newVersion}`);

      return { namespace, outcome: DataMigrationOutcome.Passed };
    } catch (e) {
      this.logger.error(`Failed migration of '${namespace}' namespace from v${oldVersion} to v${newVersion}: ${e}`);

      // TODO: Localise fallback reason
      return {
        namespace,
        outcome: DataMigrationOutcome.Failed,
        reason: e instanceof ExtensionError ? e.message : 'Migration failed',
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
    const version = url.searchParams.get('version');

    if (!version) {
      throw new Error("Unable to migrate as 'version' query string parameter is missing");
    }

    return this.extensionInfo.convertStringToExtensionVersion(version);
  }
}

export type DataMigrationManagerMigrateResult = {
  results: DataMigrationResult[];
  version: ExtensionVersion;
};

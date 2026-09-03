import { allFulfilled } from 'allfulfilled';
import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { type LegacyDataService, LegacyDataServiceToken } from 'extension/common/data/legacy-data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import {
  type DataMigrationContext,
  type DataMigrationResult,
  type DataMigrationStepLegacyDataKey,
} from 'extension/common/data/migration/data-migration.model';
import {
  type DataMigrationService,
  DataMigrationServiceToken,
  type LegacyDataExport,
} from 'extension/common/data/migration/data-migration.service';
import { type DataMigrator, DataMigratorToken } from 'extension/common/data/migration/data-migrator';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { firstError } from 'extension/common/error/reason.utils';
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

  /**
   * Returns a snapshot of everything held in the legacy storages, so the user can save a copy of their 1.x data
   * before starting a migration that may change or delete it.
   */
  async exportLegacyData(): Promise<LegacyDataExport> {
    return this.dataMigrationService.exportLegacyData();
  }

  /**
   * Returns the migration steps that will be performed when migrating from the specified version, grouped by
   * migration version and then data namespace, so that they can be presented to the user before any data is
   * touched.
   *
   * Only required steps are included, and versions/namespaces with no required steps are omitted entirely.
   */
  async getRequiredMigrations(version = this.getVersion()): Promise<DataMigrationManagerRequiredMigrations> {
    const currentVersion = this.extensionInfo.getVersion();
    const versions = await this.dataMigrationService.getRequiredMigrationVersions(version);

    if (!versions.length) {
      throw ExtensionError.from('MIG409000', version, currentVersion);
    }

    let requiredMigrations: DataMigrationVersionMigration[];

    try {
      const migrations = await allFulfilled(
        versions.map(async (migrationVersion) => ({
          namespaces: await this.getRequiredNamespaceMigrations(migrationVersion, currentVersion),
          version: migrationVersion,
        })),
        firstError(this.logger, 'Failed to determine required migrations for one or more versions'),
      );

      requiredMigrations = migrations.filter(({ namespaces }) => namespaces.length > 0);
    } catch (e) {
      this.logger.error(`Failed to determine required migrations from v${version} to v${currentVersion}:`, e);

      throw ExtensionError.fallback(e, 'MIG500000');
    }

    /*
     * A version can be required while none of its steps are - the legacy data may have already been cleared by
     * hand, for example - and previewing an upgrade with nothing in it reads as though data is about to be
     * migrated when there is nothing left to migrate. Thrown outside the `try` so that the catch above cannot
     * report it as a failure to determine what is required.
     */
    if (!requiredMigrations.length) {
      throw ExtensionError.from('MIG409000', version, currentVersion);
    }

    return { migrations: requiredMigrations, version };
  }

  async migrate(version = this.getVersion()): Promise<DataMigrationManagerMigrateResult> {
    const currentVersion = this.extensionInfo.getVersion();
    const migrationVersions = await this.dataMigrationService.getRequiredMigrationVersions(version);

    if (!migrationVersions.length || !(await this.dataMigrationService.isMigrationRequired(version))) {
      throw ExtensionError.from('MIG409000', version, currentVersion);
    }

    const results: DataMigrationResult[] = [];

    if (await this.dataMigrationService.advanceMigrationPhase(version, MigrationPhase.Started)) {
      this.logger.info(`Migrating extension from v${version}`);

      /*
       * The context is built from the *migration* version rather than the version the user upgraded from, because
       * every step opts in with `oldVersion === targetOldVersion` (see `DataMigrationStepBuilder`). Passing the
       * user's version would make every step a no-op for anyone not upgrading from exactly a migration version,
       * while still reporting `Completed` - and it would disagree with `getRequiredMigrations`, which the UI uses
       * to preview the very same steps.
       */
      for (const migrationVersion of migrationVersions) {
        // Migration versions must be applied strictly in order, since a later migration may consume data an earlier
        // one wrote, so these cannot be collected and run in parallel.
        //
        // `executeMigrator` reports a failed migrator as a `Failed` result rather than rejecting, so no reason can
        // ever reach a reducer here and the default `aggregate()` is unreachable.
        // oxlint-disable-next-line no-await-in-loop
        const migrationResults = await allFulfilled(
          this.migrators.map(async (migrator) => this.executeMigrator(migrator, migrationVersion, currentVersion)),
        );

        results.push(...migrationResults);
      }
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

  /**
   * Removes the specified legacy data entries from the legacy storage they were read from, so that a migration
   * blocked by unmigratable data can be retried once the user has inspected the data and confirmed it can be
   * discarded.
   *
   * Entries that no longer exist are ignored.
   */
  async removeLegacyData(legacyData: readonly DataMigrationStepLegacyDataKey[]): Promise<void> {
    await this.dataMigrationService.removeLegacyData(legacyData);
  }

  /**
   * Discards the recorded progress for the specified version and runs its migration again.
   *
   * This is the **explicit** retry the user asks for after inspecting a failed step - typically after discarding
   * the offending legacy data with {@link removeLegacyData}. It is deliberately not the same path as a page
   * refresh: {@link migrate} still refuses to re-run a migration it has already started, so only a deliberate
   * retry gets past that guard. Re-running is safe because every step re-checks `isRequired()` first, so steps
   * that already succeeded report `Skipped` instead of repeating their work.
   */
  async retryMigration(version: ExtensionVersion): Promise<DataMigrationManagerMigrateResult> {
    this.logger.info(`Retrying extension migration from v${version}`);

    await this.dataMigrationService.resetMigrationPhase(version);

    return this.migrate(version);
  }

  private createContext(oldVersion: ExtensionVersion, newVersion: ExtensionVersion): DataMigrationContext {
    return {
      dataService: this.dataService,
      legacyDataService: this.legacyDataService,
      oldVersion,
      newVersion,
      validationService: this.validationService,
    };
  }

  private async executeMigrator(
    migrator: DataMigrator,
    oldVersion: ExtensionVersion,
    newVersion: ExtensionVersion,
  ): Promise<DataMigrationResult> {
    const { namespace } = migrator;

    try {
      const steps = await migrator.migrate(this.createContext(oldVersion, newVersion));
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

  private async getRequiredNamespaceMigrations(
    oldVersion: ExtensionVersion,
    newVersion: ExtensionVersion,
  ): Promise<DataMigrationNamespaceMigration[]> {
    const context = this.createContext(oldVersion, newVersion);
    const namespaces = await allFulfilled(
      this.migrators.map(async (migrator) => ({
        namespace: migrator.namespace,
        namespaceTitle: migrator.namespaceTitle,
        steps: await migrator.getRequiredMigrationSteps(context),
      })),
      firstError(this.logger, 'Failed to determine required migration steps for one or more namespaces'),
    );

    return namespaces.filter(({ steps }) => steps.length > 0);
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

export type DataMigrationManagerRequiredMigrations = {
  readonly migrations: readonly DataMigrationVersionMigration[];
  readonly version: ExtensionVersion;
};

export type DataMigrationVersionMigration = {
  readonly namespaces: readonly DataMigrationNamespaceMigration[];
  readonly version: ExtensionVersion;
};

export type DataMigrationNamespaceMigration = {
  readonly namespace: DataNamespace;
  readonly namespaceTitle: string;
  readonly steps: readonly string[];
};

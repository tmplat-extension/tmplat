import { allFulfilled } from 'allfulfilled';
import { type LegacyDataService, LegacyDataServiceToken } from 'extension/common/data/legacy-data.service';
import {
  type DataMigrationStepLegacyDataKey,
  type LegacyDataStorageName,
} from 'extension/common/data/migration/data-migration.model';
import {
  type MigrationDataRepository,
  MigrationDataRepositoryToken,
} from 'extension/common/data/migration/migration-data.repository';
import { type MigrationData, type MigrationVersion } from 'extension/common/data/migration/migration-data.schema';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable } from 'extension/common/di';
import { getEnumNumberName } from 'extension/common/enum.utils';
import { ExtensionError } from 'extension/common/error/extension-error';
import { firstError } from 'extension/common/error/reason.utils';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { getOrInsertComputed } from 'extension/common/map.utils';
import { compareVersions } from 'extension/common/version/version.utils';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';

const DataMigrationServiceName = 'DataMigrationService';

export const DataMigrationServiceToken = Symbol(DataMigrationServiceName);

@injectable()
export class DataMigrationService {
  private readonly logger: Logger;
  /**
   * The registry of known data migrations, each named after the **last extension version whose data format it
   * consumes** — not the set of previous versions users may upgrade from.
   *
   * Every step built by `DataMigrationStepBuilder` opts in with `oldVersion === targetOldVersion`, and all of them
   * currently target `'1.2.9'`, the final 1.x release. So `'1.2.9'` means "the 1.x legacy data format", and it
   * applies to a user arriving from *any* 1.x version — see {@link getRequiredMigrationVersions}.
   *
   * Because of that, a version in this set must never be compared directly against a user's previous version.
   */
  private readonly migrationVersions = new Set<ExtensionVersion>(['1.2.9']);

  constructor(
    @inject(LegacyDataServiceToken) private readonly legacyDataService: LegacyDataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(MigrationDataRepositoryToken) private readonly repository: MigrationDataRepository,
    @inject(TabServiceToken) private readonly tabService: TabService,
  ) {
    this.logger = logging.getLogger(DataMigrationServiceName);
  }

  /**
   * Phases track the progress of *this user's upgrade* and are therefore keyed on the version they upgraded from,
   * which is generally not a migration version. They are deliberately not gated on {@link migrationVersions}.
   */
  async advanceMigrationPhase(version: ExtensionVersion, phase: MigrationPhase): Promise<boolean> {
    const data = await this.getData();
    const versionData = DataMigrationService.findVersionData(data, version);

    if (versionData) {
      if (versionData.phase >= phase) {
        return false;
      }

      versionData.phase = phase;
    } else {
      data.versions.push({
        phase,
        version,
      });
    }

    await this.repository.set(data);

    this.logger.info(`Advanced extension migration from v${version} to '${getEnumNumberName(MigrationPhase, phase)}'`);

    return true;
  }

  /**
   * Returns a snapshot of everything currently held in the legacy storages, so that the user can save a copy of
   * their 1.x data before a migration touches (and, for some steps, deletes) it.
   *
   * This is deliberately a raw dump rather than a curated subset: its purpose is to be a last resort when a
   * migration goes wrong, so anything omitted here is data the user cannot recover by hand.
   */
  async exportLegacyData(): Promise<LegacyDataExport> {
    try {
      const [local, session] = await allFulfilled(
        [this.legacyDataService.local.all(), this.legacyDataService.session.all()],
        firstError(this.logger, 'Failed to export one or more legacy data storage areas'),
      );

      return { local, session };
    } catch (e) {
      this.logger.error('Failed to export legacy data:', e);

      throw ExtensionError.fallback(e, 'MIG500400');
    }
  }

  async getMigrationPhase(version: ExtensionVersion): Promise<MigrationPhase> {
    const versionData = await this.getVersionData(version);
    return versionData?.phase ?? MigrationPhase.Pending;
  }

  /**
   * Returns every known migration version that applies when migrating from the specified version and whose
   * migration is still required (i.e. has not been completed), ordered oldest first.
   *
   * A migration version applies when it is not **older** than `version`, because a migration is named after the
   * last version whose data format it consumes: a user arriving from 1.2.5 wrote data in the same 1.x format that
   * the `'1.2.9'` migration reads, so that migration applies to them. An empty array means there is nothing left
   * to migrate.
   */
  async getRequiredMigrationVersions(version: ExtensionVersion): Promise<ExtensionVersion[]> {
    const candidates = Array.from(this.migrationVersions)
      .filter((candidate) => compareVersions(candidate, version) >= 0)
      .toSorted(compareVersions);
    if (!candidates.length) {
      return [];
    }

    /*
     * Completion is recorded once per *user upgrade*, keyed on the version they came from, and `migrate()` only
     * advances the phase to `Completed` once every applicable migration has run. So a completed phase already
     * means every candidate is done, and there is no per-candidate progress to filter on.
     *
     * Looking the phase up per candidate would never match, since a candidate names a data format rather than a
     * version anybody upgraded from - which is exactly how a completed migration used to keep reporting itself as
     * required, leaving the migration page previewing an upgrade that had already happened.
     */
    return (await this.getMigrationPhase(version)) === MigrationPhase.Completed ? [] : candidates;
  }

  async initiateMigration(version: ExtensionVersion): Promise<void> {
    this.logger.info(`Initiating extension migration from v${version}`);

    try {
      await this.advanceMigrationPhase(version, MigrationPhase.Initiated);

      const params = new URLSearchParams();
      params.set('version', version);

      await this.tabService.createExtensionTab(`migrate.html?${params}`);
    } catch (e) {
      this.logger.error(`Failed to initiate extension migration from v${version}:`, e);

      throw ExtensionError.fallback(e, 'MIG500200');
    }
  }

  /**
   * Whether anything still needs migrating for a user upgrading from the specified version.
   *
   * The completed-phase check lives in {@link getRequiredMigrationVersions} rather than being repeated here, so
   * that the two cannot drift apart and disagree about whether a migration has already been done.
   */
  async isMigrationRequired(version: ExtensionVersion): Promise<boolean> {
    return (await this.getRequiredMigrationVersions(version)).length > 0;
  }

  /**
   * Removes the specified legacy data entries from the legacy storage they were read from.
   *
   * This is a destructive escape hatch for legacy data that cannot be migrated, allowing the user to inspect the
   * data reported by a failed migration step, confirm that it can be discarded, and then retry the migration.
   *
   * Entries that no longer exist are ignored.
   */
  async removeLegacyData(legacyData: readonly DataMigrationStepLegacyDataKey[]): Promise<void> {
    if (!legacyData.length) {
      return;
    }

    const keysByStorage = new Map<LegacyDataStorageName, Set<string>>();
    for (const { key, storage } of legacyData) {
      getOrInsertComputed(keysByStorage, storage, () => new Set<string>()).add(key);
    }

    try {
      await allFulfilled(
        Array.from(keysByStorage, async ([storage, keys]) => {
          const keysToRemove = Array.from(keys);

          await this.legacyDataService[storage].removeAll(keysToRemove);

          this.logger.info('Removed legacy data blocking extension migration', { keys: keysToRemove, storage });
        }),
        firstError(this.logger, 'Failed to remove legacy data from one or more storage areas'),
      );
    } catch (e) {
      this.logger.error('Failed to remove legacy data blocking extension migration:', e);

      throw ExtensionError.fallback(e, 'MIG500300');
    }
  }

  /**
   * Resets the recorded phase for the specified version back to {@link MigrationPhase.Pending}, so that a migration
   * which has already run can be run again.
   *
   * This is the **explicit, user-initiated** retry path and is deliberately separate from the `Started` guard in
   * `DataMigrationManager.migrate()`: that guard exists so a *refreshed* tab cannot re-run destructive steps by
   * accident, and it stays in force for every unintentional re-entry. Retrying is safe because every step re-checks
   * `isRequired()` before it runs, so a step that already succeeded reports `Skipped` rather than repeating its
   * work.
   *
   * Resetting a version that was never recorded is a no-op.
   */
  async resetMigrationPhase(version: ExtensionVersion): Promise<boolean> {
    const data = await this.getData();
    const versionData = DataMigrationService.findVersionData(data, version);

    if (!versionData || versionData.phase === MigrationPhase.Pending) {
      return false;
    }

    versionData.phase = MigrationPhase.Pending;

    await this.repository.set(data);

    this.logger.info(`Reset extension migration from v${version} so that it can be retried`);

    return true;
  }

  private static findVersionData(data: MigrationData, version: ExtensionVersion): MigrationVersion | undefined {
    return data.versions.find((d) => d.version === version);
  }

  private async getData(): Promise<MigrationData> {
    let data = await this.repository.getOptional();

    if (data === undefined) {
      data = { versions: [] };

      await this.repository.set(data);
    }

    return data;
  }

  private async getVersionData(version: ExtensionVersion): Promise<MigrationVersion | undefined> {
    return DataMigrationService.findVersionData(await this.getData(), version);
  }
}

/**
 * A raw snapshot of both legacy storages, keyed by the storage it came from.
 */
export type LegacyDataExport = Record<LegacyDataStorageName, Record<string, unknown>>;

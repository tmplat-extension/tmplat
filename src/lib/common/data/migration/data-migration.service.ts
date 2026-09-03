import {
  type MigrationDataRepository,
  MigrationDataRepositoryToken,
} from 'extension/common/data/migration/migration-data.repository';
import { type MigrationData, type MigrationDataVersion } from 'extension/common/data/migration/migration-data.schema';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable } from 'extension/common/di';
import { getEnumNumberName } from 'extension/common/enum.utils';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';

const DataMigrationServiceName = 'DataMigrationService';

export const DataMigrationServiceToken = Symbol(DataMigrationServiceName);

@injectable()
export class DataMigrationService {
  private readonly logger: Logger;
  // TODO: Confirm exactly what this is being used for and whether this will work going forward
  private readonly migrationVersions = new Set(['1.2.9']);

  constructor(
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(MigrationDataRepositoryToken) private readonly repository: MigrationDataRepository,
    @inject(TabServiceToken) private readonly tabService: TabService,
  ) {
    this.logger = logging.getLogger(DataMigrationServiceName);
  }

  async advanceMigrationPhase(version: ExtensionVersion, phase: MigrationPhase): Promise<boolean> {
    if (!this.migrationVersions.has(version)) {
      return false;
    }

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

  async getMigrationPhase(version: ExtensionVersion): Promise<MigrationPhase | undefined> {
    if (!this.migrationVersions.has(version)) {
      return;
    }

    const versionData = await this.getVersionData(version);
    return versionData?.phase ?? MigrationPhase.Pending;
  }

  async initiateMigration(version: ExtensionVersion): Promise<void> {
    this.logger.info(`Initiating extension migration from v${version}`);

    await this.advanceMigrationPhase(version, MigrationPhase.Initiated);

    const url = new URL('migrate.html');
    url.searchParams.set('version', version);

    await this.tabService.createExtensionTab(url.toString());
  }

  async isMigrationRequired(version: ExtensionVersion): Promise<boolean> {
    return this.migrationVersions.has(version) && (await this.getMigrationPhase(version)) !== MigrationPhase.Completed;
  }

  private static findVersionData(data: MigrationData, version: ExtensionVersion): MigrationDataVersion | undefined {
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

  private async getVersionData(version: ExtensionVersion): Promise<MigrationDataVersion | undefined> {
    return DataMigrationService.findVersionData(await this.getData(), version);
  }
}

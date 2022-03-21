import { isUndefined } from 'lodash-es';

import { MigrationData, MigrationDataVersion } from 'extension/common/data/migration/migration-data.model';
import {
  MigrationDataRepository,
  MigrationDataRepositoryToken,
} from 'extension/common/data/migration/migration-data.repository';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable } from 'extension/common/di';
import { getEnumNumberName } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { Logger } from 'extension/common/log/logger';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';

const DataMigrationServiceName = 'DataMigrationService';

export const DataMigrationServiceToken = Symbol(DataMigrationServiceName);

@injectable()
export class DataMigrationService {
  private readonly logger: Logger;
  private readonly migrationVersions = new Set([ExtensionVersion.V1_2_9]);

  constructor(
    @inject(LogServiceToken) logService: LogService,
    @inject(MigrationDataRepositoryToken) private readonly repository: MigrationDataRepository,
    @inject(TabServiceToken) private readonly tabService: TabService,
  ) {
    this.logger = logService.createLogger(DataMigrationServiceName);
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

    this.logger.info(
      () => `Advanced extension migration from v${version} to '${getEnumNumberName(MigrationPhase, phase)}'`,
    );

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
    if (!this.migrationVersions.has(version)) {
      return false;
    }

    return (await this.getMigrationPhase(version)) !== MigrationPhase.Completed;
  }

  private static findVersionData(data: MigrationData, version: ExtensionVersion): MigrationDataVersion | undefined {
    return data.versions.find((data) => data.version === version);
  }

  private async getData(): Promise<MigrationData> {
    let data = await this.repository.get();

    if (isUndefined(data)) {
      data = {
        versions: [],
      };

      await this.repository.set(data);
    }

    return data;
  }

  private async getVersionData(version: ExtensionVersion): Promise<MigrationDataVersion | undefined> {
    return DataMigrationService.findVersionData(await this.getData(), version);
  }
}

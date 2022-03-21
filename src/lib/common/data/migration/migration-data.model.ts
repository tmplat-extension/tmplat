import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

export type MigrationData = {
  versions: MigrationDataVersion[];
};

export type MigrationDataVersion = {
  phase: MigrationPhase;
  version: ExtensionVersion;
};

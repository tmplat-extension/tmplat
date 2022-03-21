import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { LegacyDataService } from 'extension/common/data/legacy-data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

export type DataMigrationContext = {
  readonly legacyDataService: LegacyDataService;
  readonly oldVersion: ExtensionVersion;
  readonly newVersion: ExtensionVersion;
};

export type DataMigrationResult = {
  readonly namespace: DataNamespace;
} & (
  | {
      readonly outcome: DataMigrationOutcome.Passed | DataMigrationOutcome.Unknown;
    }
  | {
      readonly outcome: DataMigrationOutcome.Failed | DataMigrationOutcome.Skipped;
      readonly reason: string;
    }
);

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { LegacyDataService } from 'extension/common/data/legacy-data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key';

export type DataMigrationContext = {
  readonly legacyDataService: LegacyDataService;
  readonly oldVersion: ExtensionVersion;
  readonly newVersion: ExtensionVersion;
};

export type DataMigrationStep = {
  descriptionKey: IntlMessageKey;
  isRequired(context: DataMigrationContext): Promise<boolean>;
  migrate(context: DataMigrationContext): Promise<void>;
};

export type DataMigrationResult = {
  readonly namespace: DataNamespace;
  readonly steps: readonly DataMigrationStepResult[];
} & (
  | {
      readonly outcome: DataMigrationOutcome.Passed | DataMigrationOutcome.Unknown;
    }
  | {
      readonly outcome: DataMigrationOutcome.Failed | DataMigrationOutcome.Skipped;
      readonly reason: string;
    }
);

export type DataMigrationStepResult = {
  description: string;
} & (
  | {
      readonly outcome: DataMigrationOutcome.Passed;
    }
  | {
      readonly outcome: DataMigrationOutcome.Failed;
      readonly reason: string;
    }
);

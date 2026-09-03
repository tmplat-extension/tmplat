import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
import { type DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { type DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type ValidationService } from 'extension/common/validation/validation.service';

export type DataMigrationContext = {
  readonly dataService: DataService;
  readonly legacyDataService: LegacyDataService;
  readonly oldVersion: ExtensionVersion;
  readonly newVersion: ExtensionVersion;
  readonly validationService: ValidationService;
};

/**
 * The {@link LegacyDataService} storage a migration step reads its legacy data from.
 */
export type LegacyDataStorageName = 'local' | 'session';

export type DataMigrationStep = {
  descriptionKey: IntlMessageKey;
  isRequired(context: DataMigrationContext): Promise<boolean>;
  migrate(context: DataMigrationContext): Promise<void | DataMigrationStepResultDetail>;
};

export type DataMigrationResult = {
  readonly namespace: DataNamespace;
} & (
  | {
      readonly outcome: DataMigrationOutcome.Completed;
      readonly steps: readonly DataMigrationStepResult[];
      error?: never;
    }
  | {
      readonly error: ExtensionError;
      readonly outcome: DataMigrationOutcome.Failed;
      steps?: never;
    }
  | {
      readonly outcome: DataMigrationOutcome.Unknown;
      error?: never;
      steps?: never;
    }
);

export type DataMigrationStepResult = {
  description: string;
} & DataMigrationStepResultDetail;

export type DataMigrationStepResultDetail =
  | {
      readonly outcome: DataMigrationStepOutcome.Passed;
      errors?: never;
      reasons?: never;
    }
  | {
      readonly outcome: DataMigrationStepOutcome.Skipped;
      readonly reasons: readonly [string, ...string[]];
      errors?: never;
    }
  | {
      readonly errors: readonly [ExtensionError, ...ExtensionError[]];
      readonly outcome: DataMigrationStepOutcome.Failed;
      reasons?: never;
    };

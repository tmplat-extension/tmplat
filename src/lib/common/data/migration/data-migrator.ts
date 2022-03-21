import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

export const DataMigratorToken = Symbol('DataMigrator');

export interface DataMigrator {
  readonly namespace: DataNamespace;

  isRequired(oldVersion: ExtensionVersion, newVersion: ExtensionVersion): boolean;

  migrate(context: DataMigrationContext): Promise<void>;
}

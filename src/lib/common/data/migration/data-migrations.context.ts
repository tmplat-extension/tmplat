import { createContext, useContext } from 'react';
import { type DataMigrationManager } from 'extension/common/data/migration/data-migration-manager';

export const DataMigrationsContext = createContext<DataMigrationManager>({} as DataMigrationManager);

export const useDataMigrations = (): DataMigrationManager => useContext(DataMigrationsContext);

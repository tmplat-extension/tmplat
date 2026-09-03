import { z } from 'zod';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { ExtensionVersionSchema } from 'extension/common/extension-version.schema';

export const MigrationVersionSchema = z
  .object({
    phase: z.enum(MigrationPhase),
    version: ExtensionVersionSchema,
  })
  .meta({ id: 'MigrationVersion' });

export type MigrationVersion = z.infer<typeof MigrationVersionSchema>;

export const MigrationDataSchema = z
  .object({
    versions: z.array(MigrationVersionSchema),
  })
  .meta({ id: 'MigrationData' });

export type MigrationData = z.infer<typeof MigrationDataSchema>;

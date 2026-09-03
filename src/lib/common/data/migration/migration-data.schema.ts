import { z } from 'zod';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { ExtensionVersionSchema } from 'extension/common/extension-version.schema';

export const MigrationDataVersionSchema = z
  .object({
    phase: z.enum(MigrationPhase),
    version: ExtensionVersionSchema,
  })
  .meta({ id: 'MigrationDataVersion' });

export type MigrationDataVersion = z.infer<typeof MigrationDataVersionSchema>;

export const MigrationDataSchema = z
  .object({
    versions: z.array(MigrationDataVersionSchema),
  })
  .meta({ id: 'MigrationData' });

export type MigrationData = z.infer<typeof MigrationDataSchema>;

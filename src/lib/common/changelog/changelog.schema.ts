import { z } from 'zod';
import { ExtensionVersionSchema } from 'extension/common/extension-version.schema';

export const ChangesSchema = z.array(z.string().nonempty()).nonempty().meta({ id: 'Changes' });

export type Changes = z.infer<typeof ChangesSchema>;

export const ChangelogEntryBaseSchema = z
  .object({
    features: ChangesSchema.optional(),
    fixes: ChangesSchema.optional(),
    improvements: ChangesSchema.optional(),
    knownIssues: ChangesSchema.optional(),
    version: ExtensionVersionSchema,
  })
  .meta({ id: 'ChangelogEntryBase' });

export type ChangelogEntryBase = z.infer<typeof ChangelogEntryBaseSchema>;

export const ReleasedChangelogEntrySchema = ChangelogEntryBaseSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  unreleased: z.literal(false).optional(),
}).meta({ id: 'ReleasedChangelogEntry' });

export type ReleasedChangelogEntry = z.infer<typeof ReleasedChangelogEntrySchema>;

/**
 * A version that is still a work in progress and, as such, has no release date.
 */
export const UnreleasedChangelogEntrySchema = ChangelogEntryBaseSchema.extend({
  date: z.undefined().optional(),
  unreleased: z.literal(true),
}).meta({ id: 'UnreleasedChangelogEntry' });

export type UnreleasedChangelogEntry = z.infer<typeof UnreleasedChangelogEntrySchema>;

export const ChangelogEntrySchema = z
  .union([UnreleasedChangelogEntrySchema, ReleasedChangelogEntrySchema])
  .meta({ id: 'ChangelogEntry' });

export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

export const ChangelogSchema = z.array(ChangelogEntrySchema).meta({ id: 'Changelog' });

export type Changelog = z.infer<typeof ChangelogSchema>;

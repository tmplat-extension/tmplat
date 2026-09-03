import { z } from 'zod';
import { VersionSegment } from 'extension/common/version/version-segment.enum';

export const NotificationChangelogSchema = z
  .object({
    enabled: z.boolean(),
    scope: z.enum(VersionSegment),
  })
  .meta({ id: 'NotificationChangelog' });

export type NotificationChangelog = z.infer<typeof NotificationChangelogSchema>;

export const NotificationDataSchema = z
  .object({
    changelog: NotificationChangelogSchema,
    enabled: z.boolean(),
  })
  .meta({ id: 'NotificationData' });

export type NotificationData = z.infer<typeof NotificationDataSchema>;

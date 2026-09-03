import { z } from 'zod';
import { VersionSegment } from 'extension/common/version/version-segment.enum';

export const NotificationDataChangelogSchema = z
  .object({
    enabled: z.boolean(),
    scope: z.enum(VersionSegment),
  })
  .meta({ id: 'NotificationDataChangelog' });

export type NotificationDataChangelog = z.infer<typeof NotificationDataChangelogSchema>;

export const NotificationDataSchema = z
  .object({
    changelog: NotificationDataChangelogSchema,
    enabled: z.boolean(),
  })
  .meta({ id: 'NotificationData' });

export type NotificationData = z.infer<typeof NotificationDataSchema>;

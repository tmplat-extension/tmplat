import { z } from 'zod';

export const LegacyNotificationDataSchema = z
  .object({
    enabled: z.boolean().optional(),
  })
  .meta({ id: 'LegacyNotificationData' });

export type LegacyNotificationData = z.infer<typeof LegacyNotificationDataSchema>;

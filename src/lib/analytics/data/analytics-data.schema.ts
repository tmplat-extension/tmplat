import { z } from 'zod';

export const AnalyticsDataSchema = z
  .object({
    clientId: z.uuid(),
    enabled: z.boolean(),
  })
  .meta({ id: 'AnalyticsData' });

export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

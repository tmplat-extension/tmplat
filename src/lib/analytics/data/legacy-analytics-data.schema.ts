import { z } from 'zod';

export const LegacyAnalyticsDataSchema = z.boolean().optional().meta({ id: 'LegacyAnalyticsData' });

export type LegacyAnalyticsData = z.infer<typeof LegacyAnalyticsDataSchema>;

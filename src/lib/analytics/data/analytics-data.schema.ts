import Joi from 'joi';

import { AnalyticsData } from 'extension/analytics/data/analytics-data.model';

export const analyticsDataSchema = Joi.object<AnalyticsData>({
  clientId: Joi.string().guid().required(),
  enabled: Joi.boolean().required(),
});

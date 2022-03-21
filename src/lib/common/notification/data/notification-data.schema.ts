import Joi from 'joi';

import { NotificationData } from 'extension/common/notification/data/notification-data.model';

export const notificationDataSchema = Joi.object<NotificationData>({
  enabled: Joi.boolean().required(),
});

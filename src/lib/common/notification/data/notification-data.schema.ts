import Joi from 'joi';
import { getEnumStringValues } from 'extension/common/enum.utils';
import { NotificationData } from 'extension/common/notification/data/notification-data.model';
import { VersionSegment } from 'extension/common/version/version-segment.enum';

export const notificationDataChangeLogSchema = Joi.object({
  enabled: Joi.boolean().required(),
  scope: Joi.string()
    .valid(...getEnumStringValues(VersionSegment))
    .required(),
});

export const notificationDataSchema = Joi.object<NotificationData>({
  changeLog: notificationDataChangeLogSchema.required(),
  enabled: Joi.boolean().required(),
});

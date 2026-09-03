import Joi from 'joi';
import { getEnumNumberValues } from 'extension/common/enum.utils';
import { LoggingData } from 'extension/common/logging/data/logging-data.model';
import { LogLevel } from 'extension/common/logging/log-level.enum';

export const loggingDataSchema = Joi.object<LoggingData>({
  enabled: Joi.boolean().required(),
  level: Joi.number()
    .valid(...getEnumNumberValues(LogLevel))
    .required(),
});

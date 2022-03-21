import Joi from 'joi';

import { getEnumNumberValues } from 'extension/common/enum.utils';
import { LogData } from 'extension/common/log/data/log-data.model';
import { LogLevel } from 'extension/common/log/log-level.enum';

export const logDataSchema = Joi.object<LogData>({
  enabled: Joi.boolean().required(),
  level: Joi.number()
    .valid(...getEnumNumberValues(LogLevel))
    .required(),
});

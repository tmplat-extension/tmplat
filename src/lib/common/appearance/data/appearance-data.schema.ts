import Joi from 'joi';
import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { AppearanceData } from 'extension/common/appearance/data/appearance-data.model';
import { getEnumStringValues } from 'extension/common/enum.utils';

export const appearanceDataSchema = Joi.object<AppearanceData>({
  mode: Joi.string()
    .valid(...getEnumStringValues(AppearanceMode))
    .required(),
  templateDataGrid: Joi.object({
    columnVisibilityModel: Joi.object().pattern(Joi.string(), Joi.boolean()).required(),
    pageSize: Joi.number().integer().min(1).required(),
  }).optional(),
});

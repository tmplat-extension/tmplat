import Joi from 'joi';

import { MigrationData, MigrationDataVersion } from 'extension/common/data/migration/migration-data.model';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { getEnumNumberValues, getEnumStringValues } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';

export const migrationDataSchema = Joi.object<MigrationData>({
  versions: Joi.array()
    .items(
      Joi.object<MigrationDataVersion>({
        phase: Joi.number()
          .valid(...getEnumNumberValues(MigrationPhase))
          .required(),
        version: Joi.string()
          .valid(...getEnumStringValues(ExtensionVersion))
          .required(),
      }),
    )
    .required(),
});

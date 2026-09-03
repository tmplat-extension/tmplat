import { isString } from 'es-toolkit';
import { type z } from 'zod';
import { inject, injectable } from 'extension/common/di';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { type Substitutions } from 'extension/common/intl/intl.model';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { SchemaValidator, type SchemaValidatorOptions } from 'extension/common/validation/schema-validator';
import { validateSchema, type ValidateSchemaOptions } from 'extension/common/validation/validation.utils';

const ValidationServiceName = 'ValidationService';

export const ValidationServiceToken = Symbol(ValidationServiceName);

@injectable()
export class ValidationService {
  private readonly logger: Logger;

  constructor(@inject(LoggingServiceToken) logging: LoggingService) {
    this.logger = logging.getLogger(ValidationServiceName);
  }

  createSchemaValidator<Schema extends z.ZodType>(
    schema: Schema,
    options: ValidationServiceValidateSchemaOptions,
  ): SchemaValidator<Schema>;
  createSchemaValidator<Schema extends z.ZodType>(
    schema: Schema,
    code: ExtensionErrorCode,
    ...substitutions: Substitutions
  ): SchemaValidator<Schema>;
  createSchemaValidator<Schema extends z.ZodType>(
    schema: Schema,
    optionsOrCode: ValidationServiceValidateSchemaOptions | ExtensionErrorCode,
    ...substitutions: Substitutions
  ): SchemaValidator<Schema> {
    const options: SchemaValidatorOptions<Schema> = isString(optionsOrCode)
      ? { code: optionsOrCode, logger: this.logger, schema, substitutions }
      : {
          code: optionsOrCode.code,
          logger: optionsOrCode.parentLogger ?? this.logger,
          parentPath: optionsOrCode.parentPath,
          schema,
          substitutions: optionsOrCode.substitutions,
        };

    return new SchemaValidator(options);
  }

  isValidSchema<Schema extends z.ZodType>(input: unknown, schema: Schema): input is z.output<Schema> {
    const result = schema.safeParse(input);
    return result.success;
  }

  validateSchema<Schema extends z.ZodType>(
    input: unknown,
    schema: Schema,
    options: ValidationServiceValidateSchemaOptions,
  ): z.output<Schema>;
  validateSchema<Schema extends z.ZodType>(
    input: unknown,
    schema: Schema,
    code: ExtensionErrorCode,
    ...substitutions: Substitutions
  ): z.output<Schema>;
  validateSchema<Schema extends z.ZodType>(
    input: unknown,
    schema: Schema,
    optionsOrCode: ValidationServiceValidateSchemaOptions | ExtensionErrorCode,
    ...substitutions: Substitutions
  ): z.output<Schema> {
    const options: ValidateSchemaOptions = isString(optionsOrCode)
      ? { code: optionsOrCode, logger: this.logger, substitutions }
      : {
          code: optionsOrCode.code,
          logger: optionsOrCode.parentLogger ?? this.logger,
          parentPath: optionsOrCode.parentPath,
          substitutions: optionsOrCode.substitutions,
        };

    return validateSchema(input, schema, options);
  }
}

export type ValidationServiceValidateSchemaOptions = {
  code: ExtensionErrorCode;
  parentLogger?: Logger;
  parentPath?: string[];
  substitutions?: Substitutions;
};

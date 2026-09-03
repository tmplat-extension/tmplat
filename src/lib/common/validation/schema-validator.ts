import { isString } from 'es-toolkit';
import { type z } from 'zod';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { type Substitutions } from 'extension/common/intl/intl.model';
import { type Logger } from 'extension/common/logging/logger';
import { validateSchema, type ValidateSchemaOptions } from 'extension/common/validation/validation.utils';

export class SchemaValidator<Schema extends z.ZodType> {
  private readonly options: ValidateSchemaOptions;
  private readonly schema: Schema;

  constructor(options: SchemaValidatorOptions<Schema>) {
    const { schema, ...validateSchemaOptions } = options;

    this.options = validateSchemaOptions;
    this.schema = schema;
  }

  isValid(input: unknown): input is z.output<Schema> {
    const result = this.schema.safeParse(input);
    return result.success;
  }

  validate(input: unknown): z.output<Schema>;
  validate(input: unknown, options: SchemaValidatorValidateOptions): z.output<Schema>;
  validate(input: unknown, code: ExtensionErrorCode, ...substitutions: Substitutions): z.output<Schema>;
  validate(
    input: unknown,
    optionsOrCode?: SchemaValidatorValidateOptions | ExtensionErrorCode,
    ...substitutions: Substitutions
  ): z.output<Schema> {
    let options: ValidateSchemaOptions = this.options;
    if (isString(optionsOrCode)) {
      options = { ...this.options, code: optionsOrCode, substitutions };
    } else if (optionsOrCode) {
      options = { ...this.options, ...optionsOrCode };
    }

    return validateSchema(input, this.schema, options);
  }
}

export type SchemaValidatorOptions<Schema extends z.ZodType> = {
  code: ExtensionErrorCode;
  logger: Logger;
  parentPath?: string[];
  schema: Schema;
  substitutions?: Substitutions;
};

export type SchemaValidatorValidateOptions = {
  code?: ExtensionErrorCode;
  parentPath?: string[];
  substitutions?: Substitutions;
};

import { type z } from 'zod';
import { ExtensionError, type ExtensionErrorFromOptions } from 'extension/common/error/extension-error';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { convertZodErrorToFieldErrors } from 'extension/common/error/field-error.utils';
import { type Substitutions } from 'extension/common/intl/intl.model';
import { type Logger } from 'extension/common/logging/logger';

const convertZodErrorToErrorOptions = <Output>(
  err: z.ZodError<Output>,
  options: ValidateSchemaOptions,
): ExtensionErrorFromOptions => ({
  cause: err,
  code: options.code,
  fieldErrors: convertZodErrorToFieldErrors(err, options.parentPath),
  substitutions: options.substitutions,
});

export const isValidSchema = <Schema extends z.ZodType>(input: unknown, schema: Schema): input is z.output<Schema> => {
  const result = schema.safeParse(input);
  return result.success;
};

export const validateSchema = <Schema extends z.ZodType>(
  input: unknown,
  schema: Schema,
  options: ValidateSchemaOptions,
): z.output<Schema> => {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }

  const schemaId = schema.meta()?.id ?? 'unknown';
  const error = ExtensionError.from(convertZodErrorToErrorOptions(result.error, options));

  options.logger.error(`Input failed validation schema[id=${schemaId}]:`, error, error.fieldErrors);

  throw error;
};

export type ValidateSchemaOptions = {
  code: ExtensionErrorCode;
  logger: Logger;
  parentPath?: string[];
  substitutions?: Substitutions;
};

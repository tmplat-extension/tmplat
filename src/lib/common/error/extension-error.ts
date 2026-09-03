import { isString } from 'es-toolkit';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { type ExtensionErrorJSON, ExtensionErrorJSONSchema } from 'extension/common/error/extension-error-json.schema';
import { type FieldError } from 'extension/common/error/field-error.schema';
import { convertZodErrorToFieldErrors } from 'extension/common/error/field-error.utils';
import { localizeMessage } from 'extension/common/intl/i18n.utils';
import { type Substitutions } from 'extension/common/intl/intl.model';
import { type Logger } from 'extension/common/logging/logger';

const ExtensionErrorName = 'ExtensionError';

export class ExtensionError extends Error {
  readonly code: ExtensionErrorCode;
  readonly fieldErrors?: FieldError[];

  private constructor(options: ExtensionErrorConstructorOptions) {
    super(
      options.messageOverride ?? localizeMessage(`xerr_${options.code.toLowerCase()}`, options.substitutions ?? []),
      {
        cause: options.cause,
      },
    );

    this.code = options.code;
    this.name = `${ExtensionErrorName}(${options.code})`;

    if (options.fieldErrors) {
      this.fieldErrors = structuredClone(options.fieldErrors);
    }

    Object.setPrototypeOf(this, new.target.prototype);

    if (options.stackOverride) {
      this.stack = options.stackOverride;
    }
  }

  toJSON(): ExtensionErrorJSON {
    return {
      fieldErrors: this.fieldErrors,
      code: this.code,
      message: this.message,
      name: this.name as 'ExtensionError',
      stack: this.stack,
    };
  }

  static fallback(cause: unknown, options: ExtensionErrorFromCauseOptions): ExtensionError;
  static fallback(cause: unknown, code: ExtensionErrorCode, ...substitutions: Substitutions): ExtensionError;
  static fallback(
    cause: unknown,
    optionsOrCode: ExtensionErrorFromCauseOptions | ExtensionErrorCode,
    ...substitutions: Substitutions
  ): ExtensionError {
    if (cause instanceof ExtensionError) {
      return cause;
    }

    const options: ExtensionErrorConstructorOptions = isString(optionsOrCode)
      ? { cause, code: optionsOrCode, substitutions }
      : { ...optionsOrCode, cause };
    return new ExtensionError(options);
  }

  static from(options: ExtensionErrorFromOptions): ExtensionError;
  static from(code: ExtensionErrorCode, ...substitutions: Substitutions): ExtensionError;
  static from(
    optionsOrCode: ExtensionErrorFromOptions | ExtensionErrorCode,
    ...substitutions: Substitutions
  ): ExtensionError {
    const options: ExtensionErrorConstructorOptions = isString(optionsOrCode)
      ? { code: optionsOrCode, substitutions }
      : optionsOrCode;
    return new ExtensionError(options);
  }

  static fromCause(cause: unknown, options: ExtensionErrorFromCauseOptions): ExtensionError;
  static fromCause(cause: unknown, code: ExtensionErrorCode, ...substitutions: Substitutions): ExtensionError;
  static fromCause(
    cause: unknown,
    optionsOrCode: ExtensionErrorFromCauseOptions | ExtensionErrorCode,
    ...substitutions: Substitutions
  ): ExtensionError {
    const options: ExtensionErrorConstructorOptions = isString(optionsOrCode)
      ? { cause, code: optionsOrCode, substitutions }
      : { ...optionsOrCode, cause };
    return new ExtensionError(options);
  }

  // Note: this validates inline rather than using `validateSchema` from `extension/common/validation/validation.utils`,
  // which itself depends on this module. Importing it here would create a circular dependency between the error and
  // validation layers.
  static fromJSON(value: unknown, options: ExtensionErrorFromJSONOptions): ExtensionError {
    const result = ExtensionErrorJSONSchema.safeParse(value);
    if (!result.success) {
      const schemaId = ExtensionErrorJSONSchema.meta()?.id ?? 'unknown';
      const error = ExtensionError.from({
        cause: result.error,
        code: 'ERR422000',
        fieldErrors: convertZodErrorToFieldErrors(result.error),
      });

      options.logger.error(`Input failed validation schema[id=${schemaId}]:`, error, error.fieldErrors);

      throw error;
    }

    const { code, message: messageOverride, stack: stackOverride } = result.data;

    return new ExtensionError({
      code,
      messageOverride,
      stackOverride,
    });
  }
}

type ExtensionErrorConstructorOptions = ExtensionErrorFromOptions & {
  messageOverride?: string;
  stackOverride?: string;
};

export type ExtensionErrorFromCauseOptions = Omit<ExtensionErrorFromOptions, 'cause'> & {
  cause: unknown;
};

export type ExtensionErrorFromJSONOptions = {
  logger: Logger;
};

export type ExtensionErrorFromOptions = {
  cause?: unknown;
  code: ExtensionErrorCode;
  fieldErrors?: FieldError[];
  substitutions?: Substitutions;
};

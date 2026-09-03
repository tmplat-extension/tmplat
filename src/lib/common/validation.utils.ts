import Joi from 'joi';

export function isValid<T = unknown>(schema: Joi.Schema<T>, value: unknown): value is T {
  const { error, value: validValue } = schema.validate(value);

  return error === undefined && validValue !== undefined;
}

export async function isValidAsync<T = unknown>(schema: Joi.Schema<T>, value: unknown): Promise<boolean> {
  try {
    const validValue = await schema.validateAsync(value);

    return validValue !== undefined;
  } catch (_) {
    return false;
  }
}

export function isValidOrUndefined<T = unknown>(schema: Joi.Schema<T>, value: unknown): value is T | undefined {
  const { error } = schema.validate(value);

  return error === undefined;
}

export async function isValidOrUndefinedAsync<T = unknown>(schema: Joi.Schema<T>, value: unknown): Promise<boolean> {
  try {
    await schema.validateAsync(value);
    return true;
  } catch (_) {
    return false;
  }
}

export function validateSchema<T = unknown>(schema: Joi.Schema<T>, value: unknown, errors: SchemaValidationErrors): T {
  const { error, value: validValue } = schema.validate(value);
  if (error) {
    throw errors.general(error);
  }
  if (validValue === undefined) {
    throw errors.undefinedValue();
  }

  return validValue;
}

export async function validateSchemaAsync<T = unknown>(
  schema: Joi.Schema<T>,
  value: unknown,
  errors: SchemaValidationErrors,
): Promise<T> {
  let validValue: T | undefined;

  try {
    validValue = await schema.validateAsync(value);
  } catch (e) {
    throw errors.general(e instanceof Joi.ValidationError ? e : undefined);
  }

  if (validValue === undefined) {
    throw errors.undefinedValue();
  }

  return validValue;
}

export function validateSchemaOrUndefined<T = unknown>(schema: Joi.Schema<T>, value: unknown): T | undefined {
  const { value: validValue } = schema.validate(value);
  return validValue;
}

export async function validateSchemaOrUndefinedAsync<T = unknown>(
  schema: Joi.Schema<T>,
  value: unknown,
): Promise<T | undefined> {
  try {
    return await schema.validateAsync(value);
  } catch (_) {
    return;
  }
}

export type SchemaValidationErrors = {
  general: (error?: Joi.ValidationError) => Error;
  undefinedValue: () => Error;
};

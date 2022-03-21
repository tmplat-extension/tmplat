import Joi from 'joi';
import { isUndefined } from 'lodash-es';

export function isValid<T = any>(schema: Joi.Schema<T>, value: any): boolean {
  const { error, value: validValue } = schema.validate(value);

  return isUndefined(error) && !isUndefined(validValue);
}

export async function isValidAsync<T = any>(schema: Joi.Schema<T>, value: any): Promise<boolean> {
  try {
    const validValue = await schema.validateAsync(value);

    return !isUndefined(validValue);
  } catch (_) {
    return false;
  }
}

export function isValidOrUndefined<T = any>(schema: Joi.Schema<T>, value: any): boolean {
  const { error } = schema.validate(value);

  return isUndefined(error);
}

export async function isValidOrUndefinedAsync<T = any>(schema: Joi.Schema<T>, value: any): Promise<boolean> {
  try {
    await schema.validateAsync(value);
    return true;
  } catch (_) {
    return false;
  }
}

export function validateSchema<T = any>(schema: Joi.Schema<T>, value: any, errors: SchemaValidationErrors): T {
  const { error, value: validValue } = schema.validate(value);
  if (error) {
    throw errors.general(error);
  }
  if (isUndefined(validValue)) {
    throw errors.undefinedValue();
  }

  return validValue;
}

export async function validateSchemaAsync<T = any>(
  schema: Joi.Schema<T>,
  value: any,
  errors: SchemaValidationErrors,
): Promise<T> {
  let validValue: T | undefined;

  try {
    validValue = await schema.validateAsync(value);
  } catch (e) {
    throw errors.general(e instanceof Joi.ValidationError ? e : undefined);
  }

  if (isUndefined(validValue)) {
    throw errors.undefinedValue();
  }

  return validValue;
}

export function validateSchemaOrUndefined<T = any>(schema: Joi.Schema<T>, value: any): T | undefined {
  const { value: validValue } = schema.validate(value);
  return validValue;
}

export async function validateSchemaOrUndefinedAsync<T = any>(
  schema: Joi.Schema<T>,
  value: any,
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

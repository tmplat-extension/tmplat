import { isNumber, isString } from 'lodash-es';

export function getEnumNumberName(enumType: NumberEnumType, value: number): string {
  const name = enumType[value];
  if (isString(name)) {
    return name;
  }

  throw createEnumNameNotFoundError(value);
}

export function getEnumNumberValues(enumType: NumberEnumType): readonly number[] {
  return Object.values(enumType).filter(isNumber);
}

export function getEnumStringName(enumType: StringEnumType, value: string): string {
  for (const [name, enumValue] of Object.entries(enumType)) {
    if (enumValue === value) {
      return name;
    }
  }

  throw createEnumNameNotFoundError(value);
}

export function getEnumStringValues(enumType: StringEnumType): readonly string[] {
  return Object.values(enumType);
}

export function isEnumNumberValue<E extends NumberEnumType, N extends keyof E>(enumType: E, value: any): value is E[N] {
  return isNumber(value) && Object.values(enumType).some((enumValue) => enumValue === value);
}

export function isEnumStringValue<E extends StringEnumType, N extends keyof E>(enumType: E, value: any): value is E[N] {
  return isString(value) && getEnumStringValues(enumType).includes(value);
}

function createEnumNameNotFoundError(value: any): Error {
  return new Error(`Enum name could not be found for value: '${value}'`);
}

export type NumberEnumType = Readonly<Record<string, number | string>>;

export type StringEnumType = Readonly<Record<string, string>>;

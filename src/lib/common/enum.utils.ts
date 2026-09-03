import { isNumber, isString } from 'extension/common/type.utils';

const createEnumNameNotFoundError = (value: unknown): Error =>
  new Error(`Enum name could not be found for value: '${value}'`);

export const getEnumNames = (enumType: HeterogeneousEnumType | NumberEnumType | StringEnumType): readonly string[] =>
  Object.keys(enumType);

export const getEnumNumberName = (enumType: HeterogeneousEnumType | NumberEnumType, value: number): string => {
  const name = enumType[value];
  if (isString(name)) {
    return name;
  }

  throw createEnumNameNotFoundError(value);
};

export const getEnumNumberValues = (enumType: HeterogeneousEnumType | NumberEnumType): readonly number[] =>
  Object.values(enumType).filter(isNumber);

export const getEnumStringName = (enumType: StringEnumType, value: string): string => {
  for (const [name, enumValue] of Object.entries(enumType)) {
    if (enumValue === value) {
      return name;
    }
  }

  throw createEnumNameNotFoundError(value);
};

export const getEnumStringValues = (enumType: HeterogeneousEnumType | StringEnumType): readonly string[] =>
  Object.values(enumType).filter(isString);

export function invertNumberEnum(enumType: HeterogeneousEnumType | NumberEnumType): Record<string, string>;
export function invertNumberEnum<T>(
  enumType: HeterogeneousEnumType | NumberEnumType,
  mapper: (name: string) => T,
): Record<string, T>;
export function invertNumberEnum<T = string>(
  enumType: HeterogeneousEnumType | NumberEnumType,
  mapper?: (name: string) => T,
): Record<string, T> {
  return Object.entries(enumType).reduce(
    (acc, [name, value]) => {
      if (isNumber(value)) {
        acc[value] = mapper ? mapper(name) : (name as T);
      }
      return acc;
    },
    {} as Record<string, T>,
  );
}

export const isEnumNumberValue = <E extends HeterogeneousEnumType | NumberEnumType, N extends keyof E>(
  enumType: E,
  value: unknown,
): value is E[N] => isNumber(value) && Object.values(enumType).some((enumValue) => enumValue === value);

export const isEnumStringValue = <E extends HeterogeneousEnumType | StringEnumType, N extends keyof E>(
  enumType: E,
  value: unknown,
): value is E[N] => isString(value) && getEnumStringValues(enumType).includes(value);

export type HeterogeneousEnumType = Readonly<Record<string, number | string>>;

export type NumberEnumType = Readonly<Record<string, number>>;

export type StringEnumType = Readonly<Record<string, string>>;

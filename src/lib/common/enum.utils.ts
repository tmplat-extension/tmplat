import { isNumber, isString } from 'es-toolkit';

const createEnumNameNotFoundError = (value: unknown): Error =>
  new Error(`Enum name could not be found for value: '${value}'`);

export const getEnumNumberName = (enumType: HeterogeneousEnumType | NumberEnumType, value: number): string => {
  const name = enumType[value];
  if (isString(name)) {
    return name;
  }

  throw createEnumNameNotFoundError(value);
};

export const getEnumNumberValues = (enumType: HeterogeneousEnumType | NumberEnumType): readonly number[] =>
  Object.values(enumType).filter(isNumber);

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

export const isEnumStringValue = <E extends HeterogeneousEnumType | StringEnumType, N extends keyof E>(
  enumType: E,
  value: unknown,
): value is E[N] => isString(value) && getEnumStringValues(enumType).includes(value);

export type HeterogeneousEnumType = Readonly<Record<string, number | string>>;

export type NumberEnumType = Readonly<Record<string, number>>;

export type StringEnumType = Readonly<Record<string, string>>;

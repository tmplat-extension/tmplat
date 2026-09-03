import { describe, expect, it } from 'vitest';
import {
  getEnumNumberName,
  getEnumNumberValues,
  getEnumStringValues,
  invertNumberEnum,
  isEnumStringValue,
} from 'extension/common/enum.utils';

enum NumberEnum {
  First,
  Second,
  Third,
}

enum StringEnum {
  First = 'first',
  Second = 'second',
}

describe('getEnumNumberValues', () => {
  it('returns only the numeric values, excluding the reverse-mapped names', () => {
    expect(getEnumNumberValues(NumberEnum)).toEqual([0, 1, 2]);
  });
});

describe('getEnumStringValues', () => {
  it('returns the string values of a string enum', () => {
    expect(getEnumStringValues(StringEnum)).toEqual(['first', 'second']);
  });

  it('returns the reverse-mapped names of a number enum', () => {
    expect(getEnumStringValues(NumberEnum)).toEqual(['First', 'Second', 'Third']);
  });
});

describe('getEnumNumberName', () => {
  it.each([
    [NumberEnum.First, 'First'],
    [NumberEnum.Second, 'Second'],
    [NumberEnum.Third, 'Third'],
  ])('returns the name for value %i', (value, expected) => {
    expect(getEnumNumberName(NumberEnum, value)).toBe(expected);
  });

  it('throws when the value is not a member', () => {
    expect(() => getEnumNumberName(NumberEnum, 99)).toThrow("Enum name could not be found for value: '99'");
  });
});

describe('invertNumberEnum', () => {
  it('maps values to names by default', () => {
    expect(invertNumberEnum(NumberEnum)).toEqual({ 0: 'First', 1: 'Second', 2: 'Third' });
  });

  it('applies the supplied mapper to each name', () => {
    expect(invertNumberEnum(NumberEnum, (name) => name.toLowerCase())).toEqual({
      0: 'first',
      1: 'second',
      2: 'third',
    });
  });
});

describe('isEnumStringValue', () => {
  it.each(['first', 'second'])('returns true for member value %s', (value) => {
    expect(isEnumStringValue(StringEnum, value)).toBe(true);
  });

  it.each([
    ['a member name rather than value', 'First'],
    ['a non-member string', 'third'],
    ['a number', 0],
    ['null', null],
    ['undefined', undefined],
  ])('returns false for %s', (_label, value) => {
    expect(isEnumStringValue(StringEnum, value)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  getEnumNames,
  getEnumNumberName,
  getEnumNumberValues,
  getEnumStringName,
  getEnumStringValues,
  invertNumberEnum,
  isEnumNumberValue,
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

describe('getEnumNames', () => {
  it('returns the reverse-mapped names and values for a number enum', () => {
    expect(getEnumNames(NumberEnum)).toEqual(['0', '1', '2', 'First', 'Second', 'Third']);
  });

  it('returns only the names for a string enum', () => {
    expect(getEnumNames(StringEnum)).toEqual(['First', 'Second']);
  });
});

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

describe('getEnumStringName', () => {
  it.each([
    [StringEnum.First, 'First'],
    [StringEnum.Second, 'Second'],
  ])('returns the name for value %s', (value, expected) => {
    expect(getEnumStringName(StringEnum, value)).toBe(expected);
  });

  it('throws when the value is not a member', () => {
    expect(() => getEnumStringName(StringEnum, 'third')).toThrow("Enum name could not be found for value: 'third'");
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

describe('isEnumNumberValue', () => {
  it.each([0, 1, 2])('returns true for member value %i', (value) => {
    expect(isEnumNumberValue(NumberEnum, value)).toBe(true);
  });

  it.each([
    ['a non-member number', 99],
    ['a reverse-mapped name', 'First'],
    ['null', null],
    ['undefined', undefined],
  ])('returns false for %s', (_label, value) => {
    expect(isEnumNumberValue(NumberEnum, value)).toBe(false);
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

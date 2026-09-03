import { describe, expect, it } from 'vitest';
import { getOwnKeysMissing, hasOwnKeys } from 'extension/common/object.utils';

describe('hasOwnKeys', () => {
  it('returns true when every key is an own property', () => {
    expect(hasOwnKeys({ a: 1, b: 2 }, ['a', 'b'])).toBe(true);
  });

  it('returns true when no keys are required', () => {
    expect(hasOwnKeys({}, [])).toBe(true);
  });

  it('returns false when a key is missing', () => {
    expect(hasOwnKeys({ a: 1 }, ['a', 'b'])).toBe(false);
  });

  it('returns true for an own property explicitly set to undefined', () => {
    expect(hasOwnKeys({ a: undefined }, ['a'])).toBe(true);
  });

  it('returns false for an inherited property', () => {
    expect(hasOwnKeys(Object.create({ a: 1 }) as object, ['a'])).toBe(false);
  });

  it('narrows the object so the keys can be accessed', () => {
    const value: { a?: string } = { a: 'x' };
    if (hasOwnKeys(value, ['a'])) {
      expect(value.a.length).toBe(1);
    } else {
      expect.unreachable('expected value to have own key');
    }
  });
});

describe('getOwnKeysMissing', () => {
  it('returns an empty array when every key is present', () => {
    expect(getOwnKeysMissing({ a: 1, b: 2 }, ['a', 'b'])).toEqual([]);
  });

  it('returns only the missing keys, in the order supplied', () => {
    expect(getOwnKeysMissing({ b: 2 }, ['a', 'b', 'c'])).toEqual(['a', 'c']);
  });

  it('agrees with hasOwnKeys', () => {
    const obj = { a: 1 };
    const keys = ['a', 'b'] as const;

    expect(getOwnKeysMissing(obj, keys).length === 0).toBe(hasOwnKeys(obj, keys));
  });
});

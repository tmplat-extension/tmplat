import { describe, expect, it } from 'vitest';
import { atOneBasedIndex, joinQuoted } from 'extension/common/array.utils';

describe('atOneBasedIndex', () => {
  const arr = ['a', 'b', 'c'];

  it.each([
    [1, 'a'],
    [2, 'b'],
    [3, 'c'],
  ])('returns the item at one-based index %i', (index, expected) => {
    expect(atOneBasedIndex(arr, index)).toBe(expected);
  });

  it.each([
    [-1, 'c'],
    [-2, 'b'],
    [-3, 'a'],
  ])('counts back from the end for negative index %i', (index, expected) => {
    expect(atOneBasedIndex(arr, index)).toBe(expected);
  });

  it.each([
    ['zero', 0],
    ['NaN', Number.NaN],
    ['an index beyond the end', 4],
    ['a negative index beyond the start', -4],
  ])('returns undefined for %s', (_label, index) => {
    expect(atOneBasedIndex(arr, index)).toBeUndefined();
  });

  it('returns undefined for an empty array', () => {
    expect(atOneBasedIndex([], 1)).toBeUndefined();
  });
});

describe('joinQuoted', () => {
  it('returns an empty string for an empty array', () => {
    expect(joinQuoted([])).toBe('');
  });

  it('double-quotes a single item without a delimiter', () => {
    expect(joinQuoted(['a'])).toBe('"a"');
  });

  it('joins with a single space by default', () => {
    expect(joinQuoted(['a', 'b', 'c'])).toBe('"a" "b" "c"');
  });

  it('uses the supplied delimiter', () => {
    expect(joinQuoted(['a', 'b'], { delimiter: ', ' })).toBe('"a", "b"');
  });

  it('uses single quotes when requested', () => {
    expect(joinQuoted(['a', 'b'], { single: true })).toBe("'a' 'b'");
  });

  it('honors both options together', () => {
    expect(joinQuoted(['a', 'b'], { delimiter: ' | ', single: true })).toBe("'a' | 'b'");
  });

  it('quotes empty items like any other', () => {
    expect(joinQuoted(['', 'b'])).toBe('"" "b"');
  });
});

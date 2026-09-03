import { describe, expect, it } from 'vitest';
import { getOwnKeysMissing } from 'extension/common/object.utils';

describe('getOwnKeysMissing', () => {
  it('returns an empty array when every key is present', () => {
    expect(getOwnKeysMissing({ a: 1, b: 2 }, ['a', 'b'])).toEqual([]);
  });

  it('returns only the missing keys, in the order supplied', () => {
    expect(getOwnKeysMissing({ b: 2 }, ['a', 'b', 'c'])).toEqual(['a', 'c']);
  });
});

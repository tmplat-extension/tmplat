import { describe, expect, it, vi } from 'vitest';
import { getOrInsert, getOrInsertComputed } from 'extension/common/map.utils';

describe('getOrInsertComputed', () => {
  it('computes, inserts and returns the value when the key is absent', () => {
    const map = new Map<string, number>();
    const compute = vi.fn(() => 1);

    expect(getOrInsertComputed(map, 'key', compute)).toBe(1);
    expect(map.get('key')).toBe(1);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('passes the key to the compute function', () => {
    const map = new Map<string, string>();

    expect(getOrInsertComputed(map, 'key', (key) => `computed:${key}`)).toBe('computed:key');
  });

  it('returns the existing value without computing when the key is present', () => {
    const map = new Map<string, number>([['key', 1]]);
    const compute = vi.fn(() => 2);

    expect(getOrInsertComputed(map, 'key', compute)).toBe(1);
    expect(map.get('key')).toBe(1);
    expect(compute).not.toHaveBeenCalled();
  });

  // The value is looked up again after insertion rather than the computed value being returned directly, so callers
  // and a subsequent `map.get` can never disagree.
  it('returns the same instance on every call for a given key', () => {
    const map = new Map<string, object>();
    const first = getOrInsertComputed(map, 'key', () => ({}));
    const second = getOrInsertComputed(map, 'key', () => ({}));

    expect(second).toBe(first);
  });

  // A stored `undefined` is still a present key, so it must not be recomputed. This is the case a bare
  // `map.get(key) ?? compute()` would get wrong.
  it('does not recompute a key explicitly stored as undefined', () => {
    const map = new Map<string, number | undefined>([['key', undefined]]);
    const compute = vi.fn(() => 1);

    expect(getOrInsertComputed(map, 'key', compute)).toBeUndefined();
    expect(compute).not.toHaveBeenCalled();
  });

  it('treats distinct keys independently', () => {
    const map = new Map<string, string>();

    expect(getOrInsertComputed(map, 'a', () => 'first')).toBe('first');
    expect(getOrInsertComputed(map, 'b', () => 'second')).toBe('second');
    expect(map.size).toBe(2);
  });
});

describe('getOrInsert', () => {
  it('inserts and returns the value when the key is absent', () => {
    const map = new Map<string, number>();

    expect(getOrInsert(map, 'key', 1)).toBe(1);
    expect(map.get('key')).toBe(1);
  });

  it('returns the existing value without overwriting it when the key is present', () => {
    const map = new Map<string, number>([['key', 1]]);

    expect(getOrInsert(map, 'key', 2)).toBe(1);
    expect(map.get('key')).toBe(1);
  });

  // A stored `undefined` is still a present key, so it must not be overwritten. This is the case a bare
  // `map.get(key) ?? value` would get wrong.
  it('does not overwrite a key explicitly stored as undefined', () => {
    const map = new Map<string, number | undefined>([['key', undefined]]);

    expect(getOrInsert(map, 'key', 1)).toBeUndefined();
    expect(map.get('key')).toBeUndefined();
  });

  it('treats distinct keys independently', () => {
    const map = new Map<string, string>();

    expect(getOrInsert(map, 'a', 'first')).toBe('first');
    expect(getOrInsert(map, 'b', 'second')).toBe('second');
    expect(map.size).toBe(2);
  });
});

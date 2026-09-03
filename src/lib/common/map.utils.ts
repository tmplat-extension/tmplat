/**
 * Returns the value `map` holds for `key`, inserting `value` first if the key is absent.
 *
 * This mirrors the ES2026 `Map.prototype.getOrInsert`, which cannot be used directly for the same reasons described
 * on `getOrInsertComputed` above.
 *
 * Unlike `getOrInsertComputed`, `value` is always evaluated eagerly by the caller, even when the key is already
 * present. Prefer `getOrInsertComputed` when computing the value is expensive or has side effects.
 */
export const getOrInsert = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  if (!map.has(key)) {
    map.set(key, value);
    return value;
  }

  return map.get(key) as V;
};

/**
 * Returns the value `map` holds for `key`, inserting the result of `compute` first if the key is absent.
 *
 * This mirrors the ES2026 `Map.prototype.getOrInsertComputed`, which cannot be used directly: it is only implemented
 * by Chrome 145+ and is not available in the Node runtime that executes the unit tests. `tsconfig.json` pins `lib` to
 * `es2025` so that reaching for such an API is a compile error rather than a runtime failure.
 *
 * `compute` is only invoked when the key is absent, so it is safe for it to be expensive or to construct a resource.
 */
export const getOrInsertComputed = <K, V>(map: Map<K, V>, key: K, compute: (key: K) => V): V => {
  if (!map.has(key)) {
    const value = compute(key);
    map.set(key, value);
    return value;
  }

  return map.get(key) as V;
};

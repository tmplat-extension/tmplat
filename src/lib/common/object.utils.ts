/**
 * Returns whether `obj` has an own property for each key in `keys`, narrowing `obj` to {@link WithOwnKeys} when it
 * does.
 */
export const hasOwnKeys = <T extends object, K extends PropertyKey>(
  obj: T,
  keys: readonly K[],
): obj is WithOwnKeys<T, K> => keys.every((key) => Object.hasOwn(obj, key));

/**
 * Returns each key in `keys` for which `obj` has no own property, preserving the key types passed in.
 *
 * An empty array is returned when `obj` has an own property for every key in `keys`, which is exactly when
 * {@link hasOwnKeys} returns `true`.
 */
export const getOwnKeysMissing = <K extends PropertyKey>(obj: object, keys: readonly K[]): K[] =>
  keys.filter((key) => !Object.hasOwn(obj, key));

/**
 * The type of `T` once it's known to have own properties for each key in `K`.
 *
 * Keys that are declared on `T` become required (and have `undefined` removed from their type), while keys that are
 * unknown to `T` are added as `unknown` so that they can be safely accessed and narrowed further by the caller.
 */
export type WithOwnKeys<T, K extends PropertyKey> = T & {
  [P in K]-?: P extends keyof T ? Exclude<T[P], undefined> : unknown;
};

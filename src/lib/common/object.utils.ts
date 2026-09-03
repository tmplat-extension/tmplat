/**
 * Returns each key in `keys` for which `obj` has no own property, preserving the key types passed in.
 *
 * An empty array is returned when `obj` has an own property for every key in `keys`.
 */
export const getOwnKeysMissing = <K extends PropertyKey>(obj: object, keys: readonly K[]): K[] =>
  keys.filter((key) => !Object.hasOwn(obj, key));

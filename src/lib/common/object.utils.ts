export function hasOwnKeys(obj: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  return keys.every((key) => key in obj);
}

export function getOwnKeysMissing(obj: Readonly<Record<string, unknown>>, keys: readonly string[]): string[] {
  return keys.filter((key) => !(key in obj));
}

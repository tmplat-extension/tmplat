export function atOneBasedIndex<T = unknown>(arr: readonly T[], index: number): T | undefined {
  if (index === 0 || Number.isNaN(index)) {
    return;
  }

  return (arr as T[]).at(index > 0 ? index - 1 : index);
}

export function joinQuoted(
  arr: readonly string[],
  { delimiter = ' ', single = false }: { delimiter?: string; single?: boolean } = {},
): string {
  const quote = single ? "'" : '"';
  return arr.reduce((acc, item) => {
    if (acc) {
      return acc + delimiter + quote + item + quote;
    }
    return quote + item + quote;
  }, '');
}

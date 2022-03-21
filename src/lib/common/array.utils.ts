export function atOneBasedIndex<T = any>(arr: readonly T[], index: number): T | undefined {
  if (index === 0 || Number.isNaN(index)) {
    return;
  }

  return (arr as T[]).at(index > 0 ? index - 1 : index);
}

export function reduceToObject<T = any, K extends keyof any = keyof any, V = any>(
  arr: readonly T[],
  callback: (currentValue: T, currentIndex: number, array: readonly T[]) => [K, V] | undefined,
): Record<K, V> {
  return arr.reduce((previousValue, currentValue, currentIndex, array) => {
    const assignment = callback(currentValue, currentIndex, array);
    if (assignment) {
      previousValue[assignment[0]] = assignment[1];
    }

    return previousValue;
  }, {} as Record<K, V>);
}

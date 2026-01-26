export function findDuplicates<T>(items: T[]): T[] {
  const counts = new Map<T, number>();
  const duplicates: T[] = [];

  for (const item of items) {
    const currentCount = counts.get(item) || 0;
    counts.set(item, currentCount + 1);
  }

  for (const [item, count] of counts) {
    if (count > 1) {
      duplicates.push(item);
    }
  }

  return duplicates;
}

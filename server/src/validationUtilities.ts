export function findDuplicates<T>(items: T[]): T[] {
  const counts = new Map<T, number>();
  const duplicates: T[] = [];

  for (const item of items) {
    const currentCount = counts.get(item) ?? 0;
    counts.set(item, currentCount + 1);
  }

  for (const [item, count] of counts) {
    if (count > 1) {
      duplicates.push(item);
    }
  }

  return duplicates;
}

export function findSetDifferences<T>(
  s1: Set<T>,
  s2: Set<T>
): {
  setsMatch: boolean;
  common: Set<T>;
  inS1Only: Set<T>;
  inS2Only: Set<T>;
} {
  const common = new Set<T>();
  const inS1Only = new Set<T>();
  const inS2Only = new Set<T>();

  for (const item of s1) {
    if (!s2.has(item)) {
      inS1Only.add(item);
    } else {
      common.add(item);
    }
  }
  for (const item of s2) {
    if (!s1.has(item)) {
      inS2Only.add(item);
    } else {
      common.add(item);
    }
  }
  return {
    setsMatch: inS1Only.size === 0 && inS2Only.size === 0,
    common: common,
    inS1Only: inS1Only,
    inS2Only: inS2Only,
  };
}

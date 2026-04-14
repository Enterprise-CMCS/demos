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

export function findListDifferences<T>(
  l1: T[],
  l2: T[]
): {
  listsElementsSame: boolean;
  inL1Only: T[];
  inL2Only: T[];
  listsUnique: {
    l1: boolean;
    l2: boolean;
  };
} {
  const s1 = new Set(l1);
  const s2 = new Set(l2);
  const inL1Only: T[] = [];
  const inL2Only: T[] = [];

  for (const item of s1) {
    if (!s2.has(item)) {
      inL1Only.push(item);
    }
  }
  for (const item of s2) {
    if (!s1.has(item)) {
      inL2Only.push(item);
    }
  }
  return {
    listsElementsSame: inL1Only.length === 0 && inL2Only.length === 0,
    inL1Only: inL1Only,
    inL2Only: inL2Only,
    listsUnique: {
      l1: s1.size === l1.length,
      l2: s2.size === l2.length,
    },
  };
}

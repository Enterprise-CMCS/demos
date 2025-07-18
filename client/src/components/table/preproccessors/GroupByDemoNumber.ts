export interface RawDemonstration {
  id: number;
  title: string;
  demoNumber: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatusId: number;
  stateId: string;
  projectOfficer: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoWithSubRows extends RawDemonstration {
  subRows?: RawDemonstration[];
}

/**
 * Given a flat array of RawDemonstration, return an array of parents,
 * each with a subRows array of any older entries with the same demoNumber.
 */
export function groupByDemoNumber(
  raw: RawDemonstration[]
): DemoWithSubRows[] {
  const map = new Map<string, RawDemonstration[]>();

  // 1) Group each row by its demoNumber
  raw.forEach((item) => {
    const key = item.demoNumber;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });

  const result: DemoWithSubRows[] = [];

  // 2) For each group, sort descending by createdAt, then pick the latest as parent
  for (const groupArray of map.values()) {
    // Sort descending: newest first - thus making a "history"
    groupArray.sort((a, b) => {
      const startDate = new Date(a.evalPeriodStartDate).getTime();
      const endDate = new Date(b.evalPeriodEndDate).getTime();
      return endDate - startDate;
    });

    // First element is the “parent”
    const [latest, ...older] = groupArray;
    const parent: DemoWithSubRows = { ...latest };

    if (older.length > 0) {
      parent.subRows = older;
    }
    result.push(parent);
  }

  return result;
}


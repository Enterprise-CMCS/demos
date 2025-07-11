import { RawDemonstration } from "../tables/DemonstrationTable";

export interface DemoWithSubRows extends RawDemonstration {
  subRows?: RawDemonstration[];
}

/**
 * Groups a flat array of RawDemonstration by the demonstration title.
 *
 * For each group of rows sharing the same title:
 *   - The row with the latest evalPeriodStartDate becomes the parent
 *   - All other rows are added as subRows (older versions)
 *
 * @param raw array of RawDemonstration rows
 * @returns array of parent rows, each with possible subRows
 */
export function groupByDemoTitle(
  raw: RawDemonstration[]
): DemoWithSubRows[] {
  const map = new Map<string, RawDemonstration[]>();

  // Group by title
  raw.forEach((item) => {
    const key = item.title.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });

  const result: DemoWithSubRows[] = [];

  for (const groupArray of map.values()) {
    const [latest, ...older] = groupArray;
    const parent: DemoWithSubRows = { ...latest };

    if (older.length > 0) {
      parent.subRows = older;
    }

    result.push(parent);
  }

  return result;
}

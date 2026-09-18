import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPLICABLE_DELIVERABLES_QUERY,
  getDeliverableData,
  ReminderStage,
} from "./getDeliverableData";

const sampleRows = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    deliverable_type_id: "Quarterly Report",
    name: "Test Deliverable",
    demonstration_name: "Test Demonstration",
    state_name: "California",
    due_date: "2026-09-20T00:00:00.000Z",
    status_id: "Upcoming",
  },
];

describe("getDeliverableData", () => {
  const query = vi.fn();
  const client = { query } as unknown as PoolClient;

  beforeEach(() => {
    vi.resetAllMocks();
    query.mockResolvedValue({ rows: sampleRows });
  });

  it.each<[ReminderStage, number]>([
    ["Five Days Prior", 5],
    ["Due Today", 0],
    ["Five Days After", -5],
    ["Ten Days After", -10],
  ])(
    "queries with %s days before the due date for %s",
    async (reminderStage, daysBeforeDueDate) => {
      await getDeliverableData(client, reminderStage);

      expect(query).toHaveBeenCalledExactlyOnceWith(APPLICABLE_DELIVERABLES_QUERY, [
        daysBeforeDueDate,
      ]);
    }
  );

  it("returns the query result rows", async () => {
    const result = await getDeliverableData(client, "Five Days Prior");

    expect(result).toBe(sampleRows);
  });
});

import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPLICABLE_DEMONSTRATIONS_QUERY,
  getDemonstrationData,
  ReminderStage,
} from "./getDemonstrationData";

const sampleRows = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Test Deliverable",
    state_id: "CA",
    expiration_date: "2026-09-20T00:00:00.000Z",
  },
];

describe("getDemonstrationData", () => {
  const query = vi.fn();
  const client = { query } as unknown as PoolClient;

  beforeEach(() => {
    vi.resetAllMocks();
    query.mockResolvedValue({ rows: sampleRows });
  });

  it.each<[ReminderStage, number]>([
    ["Thirty Days Prior", 30],
    ["Sixty Days Prior", 60],
    ["Ninety Days Prior", 90],
  ])(
    "queries with %s days before the expiration date for %s",
    async (reminderStage, daysBeforeExpirationDate) => {
      await getDemonstrationData(client, reminderStage);

      expect(query).toHaveBeenCalledExactlyOnceWith(APPLICABLE_DEMONSTRATIONS_QUERY, [
        daysBeforeExpirationDate,
      ]);
    }
  );

  it("returns the query result rows", async () => {
    const result = await getDemonstrationData(client, "Thirty Days Prior");

    expect(result).toBe(sampleRows);
  });
});

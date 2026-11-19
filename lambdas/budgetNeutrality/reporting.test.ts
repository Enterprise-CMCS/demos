import { describe, expect, it, vi } from "vitest";
<<<<<<< HEAD
import { insertRows, replaceBudgetNeutralityReportingSnapshot } from "./reporting";

describe("replaceBudgetNeutralityReportingSnapshot", () => {
  it("replaces value and year rows atomically within the caller's transaction", async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };

    await replaceBudgetNeutralityReportingSnapshot(client as never, "workbook-1", {
      testValues: [
        { testId: "Main", measureId: "Without-Waiver Total", megName: null, dyNumber: 1, value: 120 },
        { testId: "Main", measureId: "Net Variance", megName: null, dyNumber: null, value: 0 },
      ],
      testYears: [{ testId: "Main", dyNumber: 1, capNeeded: false }],
    });

    expect(client.query).toHaveBeenCalledTimes(6);
    expect(client.query.mock.calls.slice(0, 4).every(([query]) => String(query).startsWith("DELETE"))).toBe(true);
    expect(client.query.mock.calls[4]?.[0]).toContain("budget_neutrality_workbook_hypothetical_value");
    expect(client.query.mock.calls[4]?.[1]).toEqual([
      expect.any(String), "workbook-1", "Main", "Without-Waiver Total", null, 1, 120,
      expect.any(Date), expect.any(Date),
      expect.any(String), "workbook-1", "Main", "Net Variance", null, null, 0,
      expect.any(Date), expect.any(Date),
    ]);
    expect(client.query.mock.calls[5]?.[0]).toContain("budget_neutrality_workbook_hypothetical_year");
    expect(client.query.mock.calls[5]?.[1]).toEqual([
      "workbook-1", "Main", 1, false, expect.any(Date), expect.any(Date),
    ]);
  });
});
=======
import { insertRows } from "./reporting";
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b

describe("insertRows", () => {
  it("splits reporting inserts below the PostgreSQL parameter limit", async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const columns = ["id", "workbook_id", "hypothetical_id", "measure_id", "meg_name", "dy_number", "value", "created_at", "updated_at"];
    const rows = Array.from({ length: 6_667 }, (_, index) => Array(9).fill(index));

    await insertRows(client as never, "budget_neutrality_workbook_hypothetical_value", columns, rows);

    expect(client.query).toHaveBeenCalledTimes(2);
    expect(client.query.mock.calls[0]?.[1]).toHaveLength(59_994);
    expect(client.query.mock.calls[1]?.[1]).toHaveLength(9);
    expect(client.query.mock.calls[0]?.[0]).toContain("$59994");
    expect(client.query.mock.calls[1]?.[0]).toContain("$9");
  });
});

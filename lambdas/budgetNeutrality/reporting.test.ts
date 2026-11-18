import { describe, expect, it, vi } from "vitest";
import { insertRows } from "./reporting";

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
import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPLICABLE_APPLICATIONS_QUERY, getApplicationData } from "./getApplicationData";

const sampleRows = [
  {
    id: "11111111-1111-1111-1111-111111111111",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
  },
];

describe("getApplicationData", () => {
  const query = vi.fn();
  const client = { query } as unknown as PoolClient;

  beforeEach(() => {
    vi.resetAllMocks();
    query.mockResolvedValue({ rows: sampleRows });
  });

  it("returns the query result rows", async () => {
    const result = await getApplicationData(client);

    expect(query).toHaveBeenCalledExactlyOnceWith(APPLICABLE_APPLICATIONS_QUERY);
    expect(result).toBe(sampleRows);
  });
});

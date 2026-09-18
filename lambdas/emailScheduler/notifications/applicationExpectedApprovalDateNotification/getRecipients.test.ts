import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EMAIL_RECIPIENTS_QUERY, getRecipients } from "./getRecipients";

const applicationId = "11111111-1111-1111-1111-111111111111";

const sampleRows = [
  {
    person_id: "22222222-2222-2222-2222-222222222222",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
  },
];

describe("getRecipients", () => {
  const query = vi.fn();
  const client = { query } as unknown as PoolClient;

  beforeEach(() => {
    vi.resetAllMocks();
    query.mockResolvedValue({ rows: sampleRows });
  });

  it("queries recipients for the given application id", async () => {
    await getRecipients(client, applicationId);

    expect(query).toHaveBeenCalledExactlyOnceWith(EMAIL_RECIPIENTS_QUERY, [applicationId]);
  });

  it("returns the query result rows", async () => {
    const result = await getRecipients(client, applicationId);

    expect(result).toBe(sampleRows);
  });
});

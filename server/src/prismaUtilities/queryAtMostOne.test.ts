import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryAtMostOne } from "./queryAtMostOne";

describe("queryAtMostOne", () => {
  const findMany = vi.fn();
  const model = {
    findMany,
  };

  const where = {
    id: "record-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findMany with the provided where clause", async () => {
    const record = { id: "record-1" };
    findMany.mockResolvedValueOnce([record]);

    await queryAtMostOne(model, where);

    expect(findMany).toHaveBeenCalledExactlyOnceWith({ where });
  });

  it("returns null when no results are found", async () => {
    findMany.mockResolvedValueOnce([]);

    const result = await queryAtMostOne(model, where);

    expect(result).toBeNull();
  });

  it("returns the single result when exactly one result is found", async () => {
    const record = { id: "record-1" };
    findMany.mockResolvedValueOnce([record]);

    const result = await queryAtMostOne(model, where);

    expect(result).toBe(record);
  });

  it("throws when more than one result is found", async () => {
    findMany.mockResolvedValueOnce([{ id: "record-1" }, { id: "record-2" }]);

    await expect(queryAtMostOne(model, where)).rejects.toThrow(
      "Expected to find at most one result, but found 2"
    );
  });
});

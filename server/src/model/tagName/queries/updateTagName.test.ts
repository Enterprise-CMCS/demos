import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateTagName } from "./updateTagName";

describe("updateTagName", () => {
  const transactionMocks = {
    tagName: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    tagName: {
      update: transactionMocks.tagName.update,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const where = { id: "tag-name-123" };
    const data = { id: "updated-tag-name" };
    const expectedCall = { where, data };

    await updateTagName(where, data, mockTransaction);
    expect(transactionMocks.tagName.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return the updated tag name", async () => {
    const updatedTagName = { id: "updated-tag-name" };
    transactionMocks.tagName.update.mockResolvedValue(updatedTagName);

    const result = await updateTagName(
      { id: "tag-name-123" },
      { id: "updated-tag-name" },
      mockTransaction
    );
    expect(result).toBe(updatedTagName);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectTagName } from "./selectTagName";

describe("selectTagName", () => {
  const transactionMocks = {
    tagName: {
      findUnique: vi.fn(),
    },
  };
  const mockTransaction = {
    tagName: {
      findUnique: transactionMocks.tagName.findUnique,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const expectedCall = {
      where: { id: "tag-name-123" },
    };

    await selectTagName("tag-name-123", mockTransaction);
    expect(transactionMocks.tagName.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return the found tag name", async () => {
    const foundTagName = { id: "tag-name-123" };
    transactionMocks.tagName.findUnique.mockResolvedValue(foundTagName);

    const result = await selectTagName("tag-name-123", mockTransaction);
    expect(result).toBe(foundTagName);
  });

  it("should return null when the tag name is not found", async () => {
    transactionMocks.tagName.findUnique.mockResolvedValue(null);

    const result = await selectTagName("missing-id", mockTransaction);
    expect(result).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectTags } from "./selectTags";

describe("selectTags", () => {
  const transactionMocks = {
    tag: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    tag: {
      findMany: transactionMocks.tag.findMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should make the expected request to the database", async () => {
    const expectedCall = {
      where: {
        tagNameId: "Existing Tag Value",
      },
    };

    await selectTags("Existing Tag Value", mockTransaction);
    expect(transactionMocks.tag.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return all tags with the matching name", async () => {
    const foundTags = [
      {
        id: "tag-1",
        tagNameId: "Existing Tag Value",
        tagTypeId: "Application",
        sourceId: "User",
        statusId: "Approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tag-2",
        tagNameId: "Existing Tag Value",
        tagTypeId: "Demonstration Type",
        sourceId: "User",
        statusId: "Approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    transactionMocks.tag.findMany.mockResolvedValue(foundTags);

    const result = await selectTags("Existing Tag Value", mockTransaction);
    expect(result).toEqual(foundTags);
  });

  it("should return an empty array when no tags are found", async () => {
    transactionMocks.tag.findMany.mockResolvedValue([]);

    const result = await selectTags("Missing Tag Value", mockTransaction);
    expect(result).toEqual([]);
  });
});

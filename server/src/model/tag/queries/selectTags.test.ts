// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types

// Functions under test
import { selectTags } from "./selectTags";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("selectTags", () => {
  const regularMocks = {
    tag: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    tag: {
      findMany: regularMocks.tag.findMany,
    },
  };

  const transactionMocks = {
    tag: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    tag: {
      findMany: transactionMocks.tag.findMany,
    },
  };

  const testTagName = "Existing Tag Value";
  const expectedCall = {
    where: {
      tagNameId: testTagName,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should create a client if a transaction is not provided", async () => {
    await selectTags({ tagNameId: testTagName });
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.tag.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.tag.findMany).not.toHaveBeenCalled();
  });

  it("should use an existing transaction if it is provided", async () => {
    await selectTags({ tagNameId: testTagName }, mockTransaction as any);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.tag.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.tag.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should return all tags with the matching name", async () => {
    const foundTags = [
      {
        id: "tag-1",
        tagNameId: testTagName,
        tagTypeId: "Application",
        sourceId: "User",
        statusId: "Approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tag-2",
        tagNameId: testTagName,
        tagTypeId: "Demonstration Type",
        sourceId: "User",
        statusId: "Approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    transactionMocks.tag.findMany.mockResolvedValue(foundTags);

    const result = await selectTags({ tagNameId: testTagName }, mockTransaction as any);
    expect(result).toEqual(foundTags);
  });

  it("should return an empty array when no tags are found", async () => {
    transactionMocks.tag.findMany.mockResolvedValue([]);

    const result = await selectTags({ tagNameId: "Missing Tag Value" }, mockTransaction as any);
    expect(result).toEqual([]);
  });
});

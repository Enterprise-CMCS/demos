// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { deleteTagNames } from "./deleteTagNames";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("deleteTagNames", () => {
  const regularMocks = {
    tagName: {
      deleteMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    tagName: {
      deleteMany: regularMocks.tagName.deleteMany,
    },
  };

  const transactionMocks = {
    tagName: {
      deleteMany: vi.fn(),
    },
  };
  const mockTransaction = {
    tagName: {
      deleteMany: transactionMocks.tagName.deleteMany,
    },
  };

  const testWhere: Prisma.TagNameWhereInput = { id: "Existing Tag Value" };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(regularMocks.tagName.deleteMany).mockResolvedValue({ count: 4 });
    vi.mocked(transactionMocks.tagName.deleteMany).mockResolvedValue({ count: 4 });
  });

  it("should create a client if a transaction is not provided", async () => {
    const result = await deleteTagNames(testWhere);
    expect(result).toBe(4);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.tagName.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: testWhere,
    });
    expect(transactionMocks.tagName.deleteMany).not.toHaveBeenCalled();
  });

  it("should use an existing transaction if it is provided", async () => {
    const result = await deleteTagNames(testWhere, mockTransaction as any);
    expect(result).toBe(4);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.tagName.deleteMany).not.toHaveBeenCalled();
    expect(transactionMocks.tagName.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: testWhere,
    });
  });
});

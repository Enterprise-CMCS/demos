// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { deleteTagRecords } from "./deleteTagRecords";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("deleteTagRecords", () => {
  const regularMocks = {
    tag: {
      deleteMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    tag: {
      deleteMany: regularMocks.tag.deleteMany,
    },
  };

  const transactionMocks = {
    tag: {
      deleteMany: vi.fn(),
    },
  };
  const mockTransaction = {
    tag: {
      deleteMany: transactionMocks.tag.deleteMany,
    },
  };

  const testWhere: Prisma.TagWhereInput = { tagNameId: "Existing Tag Value" };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(regularMocks.tag.deleteMany).mockResolvedValue({ count: 4 });
    vi.mocked(transactionMocks.tag.deleteMany).mockResolvedValue({ count: 4 });
  });

  it("should create a client if a transaction is not provided", async () => {
    const result = await deleteTagRecords(testWhere);
    expect(result).toBe(4);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.tag.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: testWhere,
    });
    expect(transactionMocks.tag.deleteMany).not.toHaveBeenCalled();
  });

  it("should use an existing transaction if it is provided", async () => {
    const result = await deleteTagRecords(testWhere, mockTransaction as any);
    expect(result).toBe(4);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.tag.deleteMany).not.toHaveBeenCalled();
    expect(transactionMocks.tag.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: testWhere,
    });
  });
});

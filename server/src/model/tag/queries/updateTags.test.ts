// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { Prisma } from "@prisma/client";

// Functions under test
import { updateTags } from "./updateTags";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("updateTags", () => {
  const regularMocks = {
    tag: {
      updateManyAndReturn: vi.fn(),
    },
  };
  const mockPrismaClient = {
    tag: {
      updateManyAndReturn: regularMocks.tag.updateManyAndReturn,
    },
  };

  const transactionMocks = {
    tag: {
      updateManyAndReturn: vi.fn(),
    },
  };
  const mockTransaction = {
    tag: {
      updateManyAndReturn: transactionMocks.tag.updateManyAndReturn,
    },
  };

  const testWhere: Prisma.TagWhereInput = { tagNameId: "Existing Tag Value" };
  const testUpdate: Prisma.TagUncheckedUpdateManyInput = {
    statusId: "Approved",
    sourceId: "System",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should create a client if a transaction is not provided", async () => {
    await updateTags(testWhere, testUpdate);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.tag.updateManyAndReturn).toHaveBeenCalledExactlyOnceWith({
      where: testWhere,
      data: testUpdate,
    });
    expect(transactionMocks.tag.updateManyAndReturn).not.toHaveBeenCalled();
  });

  it("should use an existing transaction if it is provided", async () => {
    await updateTags(testWhere, testUpdate, mockTransaction as any);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.tag.updateManyAndReturn).not.toHaveBeenCalled();
    expect(transactionMocks.tag.updateManyAndReturn).toHaveBeenCalledExactlyOnceWith({
      where: testWhere,
      data: testUpdate,
    });
  });
});

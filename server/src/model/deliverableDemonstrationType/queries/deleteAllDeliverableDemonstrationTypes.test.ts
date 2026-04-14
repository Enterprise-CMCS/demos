// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types

// Functions under test
import { deleteAllDeliverableDemonstrationTypes } from "./deleteAllDeliverableDemonstrationTypes";

// Mock imports
vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient.js";

describe("deleteAllDeliverableDemonstrationTypes", () => {
  const testWhereStatement = { deliverableId: "abc123" };
  const expectedCall = {
    where: testWhereStatement,
  };

  // Mock clients
  const regularMocks = {
    deliverableDemonstrationType: {
      deleteMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableDemonstrationType: {
      deleteMany: regularMocks.deliverableDemonstrationType.deleteMany,
    },
  };

  const transactionMocks = {
    deliverableDemonstrationType: {
      deleteMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableDemonstrationType: {
      deleteMany: transactionMocks.deliverableDemonstrationType.deleteMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should delete the deliverable demonstration type records using a new client if no transaction is given", async () => {
    await deleteAllDeliverableDemonstrationTypes(testWhereStatement);
    expect(regularMocks.deliverableDemonstrationType.deleteMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableDemonstrationType.deleteMany).not.toHaveBeenCalled();
  });

  it("should delete the deliverable demonstration type records using a transaction if one is given", async () => {
    await deleteAllDeliverableDemonstrationTypes(testWhereStatement, mockTransaction);
    expect(regularMocks.deliverableDemonstrationType.deleteMany).not.toHaveBeenCalled();
    expect(
      transactionMocks.deliverableDemonstrationType.deleteMany
    ).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

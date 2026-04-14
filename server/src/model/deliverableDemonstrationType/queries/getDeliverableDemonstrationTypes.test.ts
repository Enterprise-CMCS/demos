// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types

// Functions under test
import { getDeliverableDemonstrationTypes } from "./getDeliverableDemonstrationTypes";

// Mock imports
vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient.js";

describe("getDeliverableDemonstrationTypes", () => {
  const regularMocks = {
    deliverableDemonstrationType: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableDemonstrationType: {
      findMany: regularMocks.deliverableDemonstrationType.findMany,
    },
  };
  const transactionMocks = {
    deliverableDemonstrationType: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableDemonstrationType: {
      findMany: transactionMocks.deliverableDemonstrationType.findMany,
    },
  } as any;
  const testDeliverableId = "c8697763-fdd8-4502-b538-9e3cde153b05";
  const expectedCall = {
    where: { deliverableId: testDeliverableId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should get the deliverable demonstration types directly from the database directly if no transaction is given", async () => {
    await getDeliverableDemonstrationTypes(testDeliverableId);
    expect(regularMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableDemonstrationType.findMany).not.toHaveBeenCalled();
  });

  it("should get the deliverable demonstration types via a transaction if one is given", async () => {
    await getDeliverableDemonstrationTypes(testDeliverableId, mockTransaction);
    expect(regularMocks.deliverableDemonstrationType.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableDemonstrationType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

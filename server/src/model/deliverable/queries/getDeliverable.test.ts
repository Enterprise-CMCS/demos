import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDeliverable } from "./getDeliverable";

// Mock imports
import { prisma } from "../../../prismaClient";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("getDeliverable", () => {
  const regularMocks = {
    deliverable: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverable: {
      findUniqueOrThrow: regularMocks.deliverable.findUniqueOrThrow,
    },
  };
  const transactionMocks = {
    deliverable: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverable: {
      findUniqueOrThrow: transactionMocks.deliverable.findUniqueOrThrow,
    },
  } as any;
  const testDeliverableId = "c8697763-fdd8-4502-b538-9e3cde153b05";
  const expectedCall = {
    where: { id: testDeliverableId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should get the deliverable directly from the database directly if no transaction is given", async () => {
    await getDeliverable({ id: testDeliverableId });
    expect(regularMocks.deliverable.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverable.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should get the deliverable via a transaction if one is given", async () => {
    await getDeliverable({ id: testDeliverableId }, mockTransaction);
    expect(regularMocks.deliverable.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

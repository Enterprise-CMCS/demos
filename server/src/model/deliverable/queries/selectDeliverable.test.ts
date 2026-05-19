import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectDeliverable } from "./selectDeliverable";

// Mock imports
import { prisma } from "../../../prismaClient";
import { DELETED_DELIVERABLE_STATUS } from "../../../constants";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDeliverable", () => {
  const regularMocks = {
    deliverable: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverable: {
      findAtMostOne: regularMocks.deliverable.findAtMostOne,
    },
  };
  const transactionMocks = {
    deliverable: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverable: {
      findAtMostOne: transactionMocks.deliverable.findAtMostOne,
    },
  } as any;
  const testDeliverableId = "c8697763-fdd8-4502-b538-9e3cde153b05";
  const expectedFilteredCall = {
    where: { id: testDeliverableId, NOT: { statusId: DELETED_DELIVERABLE_STATUS } },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should get the deliverable directly from the database directly if no transaction is given", async () => {
    await selectDeliverable({ id: testDeliverableId });
    expect(prisma).toHaveBeenCalled();
    expect(regularMocks.deliverable.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedFilteredCall
    );
    expect(transactionMocks.deliverable.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get the deliverable via a transaction if one is given", async () => {
    await selectDeliverable({ id: testDeliverableId }, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverable.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findAtMostOne).toHaveBeenCalledExactlyOnceWith(
      expectedFilteredCall
    );
  });
});

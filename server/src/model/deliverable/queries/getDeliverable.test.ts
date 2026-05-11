import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDeliverable } from "./getDeliverable";

// Mock imports
import { prisma } from "../../../prismaClient";
import { DELETED_DELIVERABLE_STATUS } from "../../../constants";

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
  const expectedFilteredCall = {
    where: { id: testDeliverableId, NOT: { statusId: DELETED_DELIVERABLE_STATUS } },
  };
  const expectedUnfilteredCall = {
    where: { id: testDeliverableId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should get the deliverable directly from the database directly if no transaction is given", async () => {
    await getDeliverable({ id: testDeliverableId });
    expect(prisma).toHaveBeenCalled();
    expect(regularMocks.deliverable.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedFilteredCall
    );
    expect(transactionMocks.deliverable.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should get the deliverable via a transaction if one is given", async () => {
    await getDeliverable({ id: testDeliverableId }, { tx: mockTransaction });
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverable.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedFilteredCall
    );
  });

  it("should not filter out deleted records if passed the right option", async () => {
    await getDeliverable({ id: testDeliverableId }, { includeDeleted: true });
    expect(prisma).toHaveBeenCalled();
    expect(regularMocks.deliverable.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedUnfilteredCall
    );
    expect(transactionMocks.deliverable.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});

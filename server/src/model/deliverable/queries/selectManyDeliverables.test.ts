import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectManyDeliverables } from "./selectManyDeliverables";

// Mock imports
import { prisma } from "../../../prismaClient";
import { DELETED_DELIVERABLE_STATUS } from "../../../constants";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDeliverables", () => {
  const regularMocks = {
    deliverable: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverable: {
      findMany: regularMocks.deliverable.findMany,
    },
  };
  const transactionMocks = {
    deliverable: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverable: {
      findMany: transactionMocks.deliverable.findMany,
    },
  } as any;
  const testDemonstrationId = "7cc7f95d-cf7d-477b-acd7-ebae7109a631";
  const expectedEmptyFilteredCall = {
    where: { NOT: { statusId: DELETED_DELIVERABLE_STATUS } },
  };
  const expectedFilteredCall = {
    where: { demonstrationId: testDemonstrationId, NOT: { statusId: DELETED_DELIVERABLE_STATUS } },
  };
  const expectedUnfilteredCall = {
    where: { demonstrationId: testDemonstrationId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should only filter by the deleted flag if nothing else is passed to the function", async () => {
    await selectManyDeliverables();
    expect(prisma).toHaveBeenCalled();
    expect(regularMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedEmptyFilteredCall
    );
    expect(transactionMocks.deliverable.findMany).not.toHaveBeenCalled();
  });

  it("should use a transaction if it is passed, even if not filtering", async () => {
    await selectManyDeliverables({}, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverable.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedEmptyFilteredCall
    );
  });

  it("should get the deliverables directly from the database directly if no transaction is given", async () => {
    await selectManyDeliverables({ demonstrationId: testDemonstrationId });
    expect(prisma).toHaveBeenCalled();
    expect(regularMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith(expectedFilteredCall);
    expect(transactionMocks.deliverable.findMany).not.toHaveBeenCalled();
  });

  it("should get the deliverables via a transaction if one is given", async () => {
    await selectManyDeliverables({ demonstrationId: testDemonstrationId }, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverable.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedFilteredCall
    );
  });
});

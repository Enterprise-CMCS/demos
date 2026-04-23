import { describe, it, expect, vi, beforeEach } from "vitest";
import { getManyDeliverables } from "./getManyDeliverables";

// Mock imports
import { prisma } from "../../../prismaClient";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("getManyDeliverables", () => {
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
  const expectedCall = {
    where: { demonstrationId: testDemonstrationId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should not filter if nothing is passed to the function", async () => {
    await getManyDeliverables();
    expect(regularMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith({ where: {} });
    expect(transactionMocks.deliverable.findMany).not.toHaveBeenCalled();
  });

  it("should use a transaction if it is passed, even if not filtering", async () => {
    await getManyDeliverables({}, mockTransaction);
    expect(regularMocks.deliverable.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith({ where: {} });
  });

  it("should get the deliverables directly from the database directly if no transaction is given", async () => {
    await getManyDeliverables({ demonstrationId: testDemonstrationId });
    expect(regularMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.deliverable.findMany).not.toHaveBeenCalled();
  });

  it("should get the deliverables via a transaction if one is given", async () => {
    await getManyDeliverables({ demonstrationId: testDemonstrationId }, mockTransaction);
    expect(regularMocks.deliverable.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

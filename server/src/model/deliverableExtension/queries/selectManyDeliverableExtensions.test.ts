// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types

// Functions under test
import { selectManyDeliverableExtensions } from "./selectManyDeliverableExtensions";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("selectManyDeliverableExtensions", () => {
  const regularMocks = {
    deliverableExtension: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableExtension: {
      findMany: regularMocks.deliverableExtension.findMany,
    },
  };
  const transactionMocks = {
    deliverableExtension: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableExtension: {
      findMany: transactionMocks.deliverableExtension.findMany,
    },
  } as any;

  const expectedCall = {
    where: { deliverableId: "2b8638ad-8ce3-46de-a313-7c9c5a44ceda" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get deliverable extensions from the database directly if no transaction is given", async () => {
    await selectManyDeliverableExtensions({ deliverableId: expectedCall.where.deliverableId });
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.deliverableExtension.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableExtension.findMany).not.toHaveBeenCalled();
  });

  it("should get deliverable extensions via a transaction if one is given", async () => {
    await selectManyDeliverableExtensions(
      { deliverableId: expectedCall.where.deliverableId },
      mockTransaction
    );
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverableExtension.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableExtension.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("should default to an empty where if nothing is given", async () => {
    await selectManyDeliverableExtensions();
    expect(regularMocks.deliverableExtension.findMany).toHaveBeenCalledExactlyOnceWith({
      where: {},
    });
    expect(transactionMocks.deliverableExtension.findMany).not.toHaveBeenCalled();
  });
});

// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types

// Functions under test
import { selectDeliverableExtension } from "./selectDeliverableExtension";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("selectDeliverableExtension", () => {
  const regularMocks = {
    deliverableExtension: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableExtension: {
      findUniqueOrThrow: regularMocks.deliverableExtension.findUniqueOrThrow,
    },
  };
  const transactionMocks = {
    deliverableExtension: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableExtension: {
      findUniqueOrThrow: transactionMocks.deliverableExtension.findUniqueOrThrow,
    },
  } as any;

  const expectedCall = {
    where: { id: "2b8638ad-8ce3-46de-a313-7c9c5a44ceda" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get a deliverable extension from the database directly if no transaction is given", async () => {
    await selectDeliverableExtension(expectedCall.where.id);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.deliverableExtension.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.deliverableExtension.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should get a deliverable extension via a transaction if one is given", async () => {
    await selectDeliverableExtension(expectedCall.where.id, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverableExtension.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableExtension.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

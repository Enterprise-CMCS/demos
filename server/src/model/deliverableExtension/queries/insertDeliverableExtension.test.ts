// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types
import { InsertDeliverableExtensionInput } from "./insertDeliverableExtension";

// Functions under test
import { insertDeliverableExtension } from "./insertDeliverableExtension";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("insertDeliverableExtension", () => {
  // Test data
  const testInput: InsertDeliverableExtensionInput = {
    deliverableId: "2b8638ad-8ce3-46de-a313-7c9c5a44ceda",
    reasonCode: "Technical Difficulties",
    requestedDate: new Date(2026, 1, 3, 4, 59, 59, 999),
  };

  // Mocks
  const regularMocks = {
    deliverableExtension: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableExtension: {
      create: regularMocks.deliverableExtension.create,
    },
  };
  const transactionMocks = {
    deliverableExtension: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableExtension: {
      create: transactionMocks.deliverableExtension.create,
    },
  } as any;

  // Expectations
  const expectedCall = {
    data: {
      deliverableId: testInput.deliverableId,
      statusId: "Requested",
      reasonCodeId: testInput.reasonCode,
      originalDateRequested: testInput.requestedDate,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should insert a new deliverable extension directly if no transaction is given", async () => {
    await insertDeliverableExtension(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.deliverableExtension.create).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.deliverableExtension.create).not.toHaveBeenCalled();
  });

  it("should insert a new deliverable extension via a transaction if one is given", async () => {
    await insertDeliverableExtension(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverableExtension.create).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableExtension.create).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { UpdateDeliverableExtensionInput } from "./updateDeliverableExtension";

// Functions under test
import { updateDeliverableExtension } from "./updateDeliverableExtension";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("updateDeliverableExtension", () => {
  const regularMocks = {
    deliverableExtension: {
      update: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableExtension: {
      update: regularMocks.deliverableExtension.update,
    },
  };

  const transactionMocks = {
    deliverableExtension: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableExtension: {
      update: transactionMocks.deliverableExtension.update,
    },
  } as any;

  const testDeliverableExtensionId = "117ea28d-88a7-4fbb-9c12-bbf9ae31fc6f";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should update the provided fields using a new client if no transaction is given", async () => {
    const testInput: UpdateDeliverableExtensionInput = {
      statusId: "Denied",
    };
    const expectedCall = {
      where: {
        id: testDeliverableExtensionId,
      },
      data: {
        statusId: testInput.statusId,
      },
    };

    await updateDeliverableExtension(testDeliverableExtensionId, testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.deliverableExtension.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.deliverableExtension.update).not.toHaveBeenCalled();
  });

  it("should update the provided fields via a transaction if one is given", async () => {
    const testInput: UpdateDeliverableExtensionInput = {
      statusId: "Approved",
      finalDateGranted: new Date(2024, 11, 13, 22, 11, 15, 18),
    };
    const expectedCall = {
      where: {
        id: testDeliverableExtensionId,
      },
      data: {
        statusId: testInput.statusId,
        finalDateGranted: testInput.finalDateGranted,
      },
    };

    await updateDeliverableExtension(testDeliverableExtensionId, testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.deliverableExtension.update).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableExtension.update).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

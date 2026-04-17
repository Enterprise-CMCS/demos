// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { EditDeliverableInput } from "..";

// Functions under test
import { editDeliverable } from "./editDeliverable";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("editDeliverable", () => {
  const regularMocks = {
    deliverable: {
      update: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverable: {
      update: regularMocks.deliverable.update,
    },
  };

  const transactionMocks = {
    deliverable: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverable: {
      update: transactionMocks.deliverable.update,
    },
  } as any;

  const testDeliverableId = "92ec6ad7-23e4-471d-a61c-c7b378e72271";
  const baseTestInput: EditDeliverableInput = {
    name: "A test name",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should update the provided fields using a new client if no transaction is given", async () => {
    const expectedCall = {
      where: {
        id: testDeliverableId,
      },
      data: {
        name: baseTestInput.name,
      },
    };
    await editDeliverable(testDeliverableId, baseTestInput);
    expect(regularMocks.deliverable.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.deliverable.update).not.toHaveBeenCalled();
  });

  it("should update the provided fields via a transaction if one is given", async () => {
    const testInput = {
      ...baseTestInput,
      dueDate: new Date(2024, 11, 13, 22, 11, 15, 18),
    };
    const expectedCall = {
      where: {
        id: testDeliverableId,
      },
      data: {
        name: testInput.name,
        dueDate: testInput.dueDate,
      },
    };
    await editDeliverable(testDeliverableId, testInput, mockTransaction);
    expect(regularMocks.deliverable.update).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

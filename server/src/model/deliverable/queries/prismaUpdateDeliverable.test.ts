// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { DeliverableType, PersonType } from "../../../types.js";
import { ParsedUpdateDeliverableInput } from "..";

// Functions under test
import { prismaUpdateDeliverable } from "./prismaUpdateDeliverable";

// Mock imports
vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient.js";

describe("prismaUpdateDeliverable", () => {
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
  const baseTestInput: ParsedUpdateDeliverableInput = {
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
        deliverableTypeId: undefined,
        name: baseTestInput.name,
        cmsOwnerUserId: undefined,
        dueDate: undefined,
      },
    };
    await prismaUpdateDeliverable(testDeliverableId, baseTestInput);
    expect(regularMocks.deliverable.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.deliverable.update).not.toHaveBeenCalled();
  });

  it("should update the provided fields via a transaction if one is given", async () => {
    const expectedCall = {
      where: {
        id: testDeliverableId,
      },
      data: {
        deliverableTypeId: undefined,
        name: baseTestInput.name,
        cmsOwnerUserId: undefined,
        dueDate: undefined,
      },
    };
    await prismaUpdateDeliverable(testDeliverableId, baseTestInput, mockTransaction);
    expect(regularMocks.deliverable.update).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should parse the date correctly if one is provided", async () => {
    const testInput = {
      ...baseTestInput,
      dueDate: {
        newDueDate: {
          isEasternTZDate: true,
          easternTZDate: new TZDate(2025, 2, 14, 3, 17, 22, 931, "America/New_York"),
        },
        dateChangeNote: "A date change note",
      },
    };
    const expectedCall = {
      where: {
        id: testDeliverableId,
      },
      data: {
        deliverableTypeId: undefined,
        name: baseTestInput.name,
        cmsOwnerUserId: undefined,
        dueDate: testInput.dueDate.newDueDate.easternTZDate,
      },
    };
    await prismaUpdateDeliverable(testDeliverableId, testInput as ParsedUpdateDeliverableInput);
    expect(regularMocks.deliverable.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.deliverable.update).not.toHaveBeenCalled();
  });
});

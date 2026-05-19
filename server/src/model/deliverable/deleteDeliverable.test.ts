// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";
import { Deliverable as PrismaDeliverable } from "@prisma/client";

// Functions under test
import { deleteDeliverable } from "./deleteDeliverable";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  editDeliverable: vi.fn(),
  selectDeliverableOrThrow: vi.fn(),
  validateDeleteDeliverableInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  selectDeliverableOrThrow,
  validateDeleteDeliverableInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

describe("deleteDeliverable", () => {
  // Test inputs
  const testDeliverableId = "b18cf1ce-3e41-4a71-b4f4-585f343bc74f";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "7c1f216a-a51e-472a-a480-aa9dcdb3de7f",
      personTypeId: "demos-admin",
    },
  };

  // Mock results
  const mockDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Upcoming",
    dueDate: new Date(2027, 1, 13, 2, 55, 19, 11),
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(selectDeliverableOrThrow).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should check that the user is allowed to do this operation", async () => {
    await deleteDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testContext,
      "deleteDeliverable",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await deleteDeliverable(testDeliverableId, testContext as GraphQLContext);
      throw new Error("Expected deleteDeliverable to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await deleteDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should call the validator on the unchanged deliverable", async () => {
    await deleteDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(validateDeleteDeliverableInput).toHaveBeenCalledExactlyOnceWith(
      mockDeliverable,
      mockTransaction
    );
  });

  it("should call edit function to set the status to the passed value", async () => {
    await deleteDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { statusId: "Deleted" },
      mockTransaction
    );
  });

  it("should log an action for the completion", async () => {
    await deleteDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Deleted Deliverable",
        oldStatus: mockDeliverable.statusId,
        newStatus: "Deleted",
        oldDueDate: mockDeliverable.dueDate,
        newDueDate: mockDeliverable.dueDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });
});

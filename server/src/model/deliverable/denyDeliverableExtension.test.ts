// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { DeliverableExtensionStatus, DenyDeliverableExtensionInput } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
} from "@prisma/client";

// Functions under test
import { denyDeliverableExtension } from "./denyDeliverableExtension";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  selectDeliverableOrThrow: vi.fn(),
  validateDenyDeliverableExtensionInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

vi.mock("../deliverableExtension/queries", () => ({
  selectDeliverableExtension: vi.fn(),
  updateDeliverableExtension: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  selectDeliverableOrThrow,
  validateDenyDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";
import {
  selectDeliverableExtension,
  updateDeliverableExtension,
} from "../deliverableExtension/queries";

describe("denyDeliverableExtension", () => {
  // Test inputs
  const testDeliverableId = "9693437d-1f31-402c-bccb-ab2a5690ea30";
  const testDeliverableExtensionId = "8f86afb2-5013-4334-b8a3-6cf8098ee781";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "0a3bd415-39a3-4f72-a067-418a5219216a",
      personTypeId: "demos-admin",
    },
  };
  const testInput: DenyDeliverableExtensionInput = {
    deliverableExtensionId: testDeliverableExtensionId,
    details: "Unfortunately your request is rejected",
  };

  // Mock results
  const mockDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Past Due",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockDeliverableExtension: Partial<PrismaDeliverableExtension> = {
    id: testDeliverableExtensionId,
    statusId: "Requested" satisfies DeliverableExtensionStatus,
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
    vi.mocked(selectDeliverableExtension).mockResolvedValue(
      mockDeliverableExtension as PrismaDeliverableExtension
    );
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should check that the user is allowed to do this operation", async () => {
    await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testContext,
      "denyDeliverableExtension",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);
      throw new Error("Expected denyDeliverableExtension to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should get the deliverable extension before making changes", async () => {
    await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(selectDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableExtensionId },
      true,
      mockTransaction
    );
  });

  it("should call the validator using the unchanged records", async () => {
    await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(validateDenyDeliverableExtensionInput).toHaveBeenCalledExactlyOnceWith(
      mockDeliverable,
      mockDeliverableExtension
    );
  });

  it("should insert an action record for the approval", async () => {
    await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Denied Extension Request",
        oldStatus: mockDeliverable.statusId,
        newStatus: mockDeliverable.statusId,
        note: testInput.details,
        oldDueDate: mockDeliverable.dueDate,
        newDueDate: mockDeliverable.dueDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });

  it("should update the deliverable extension", async () => {
    await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(updateDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
      testDeliverableExtensionId,
      {
        statusId: "Denied",
      },
      mockTransaction
    );
  });

  it("should invoke the updates to tables in the right order", async () => {
    await denyDeliverableExtension(testDeliverableId, testInput, testContext as GraphQLContext);

    // Note that when resetAllMocks is called, the invocationCallOrder array is emptied
    // That is why we can compare the 0 index of each of them
    const insertDeliverableActionCallIndex =
      vi.mocked(insertDeliverableAction).mock.invocationCallOrder[0];
    const updateDeliverableExtensionCallIndex = vi.mocked(updateDeliverableExtension).mock
      .invocationCallOrder[0];
    expect(insertDeliverableActionCallIndex).toBeLessThan(updateDeliverableExtensionCallIndex);
  });
});

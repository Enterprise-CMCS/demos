// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";
import { Deliverable as PrismaDeliverable } from "@prisma/client";

// Functions under test
import { startDeliverableReview } from "./startDeliverableReview";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  editDeliverable: vi.fn(),
  selectDeliverable: vi.fn(),
  validateStartDeliverableReviewInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  selectDeliverable,
  validateStartDeliverableReviewInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

describe("startDeliverableReview", () => {
  // Test inputs
  const testDeliverableId = "b18cf1ce-3e41-4a71-b4f4-585f343bc74f";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "0a3bd415-39a3-4f72-a067-418a5219216a",
      personTypeId: "demos-admin",
    },
  };

  // Mock results
  const mockUnstartedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Submitted",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockStartedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Under CMS Review",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(selectDeliverable).mockResolvedValue(mockUnstartedDeliverable as PrismaDeliverable);
    vi.mocked(editDeliverable).mockResolvedValue(mockStartedDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should check that the user is allowed to do this operation", async () => {
    await startDeliverableReview(testDeliverableId, testContext as GraphQLContext);
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testContext,
      "startDeliverableReview",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await startDeliverableReview(testDeliverableId, testContext as GraphQLContext);
      throw new Error("Expected startDeliverableReview to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await startDeliverableReview(testDeliverableId, testContext as GraphQLContext);
    expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should call the validator on the unchanged deliverable", async () => {
    await startDeliverableReview(testDeliverableId, testContext as GraphQLContext);
    expect(validateStartDeliverableReviewInput).toHaveBeenCalledExactlyOnceWith(
      mockUnstartedDeliverable
    );
  });

  it("should call edit function to set the status to under CMS review", async () => {
    await startDeliverableReview(testDeliverableId, testContext as GraphQLContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { statusId: "Under CMS Review" },
      mockTransaction
    );
  });

  it("should log an action for the submission", async () => {
    await startDeliverableReview(testDeliverableId, testContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Started Review",
        oldStatus: mockUnstartedDeliverable.statusId,
        newStatus: mockStartedDeliverable.statusId,
        oldDueDate: mockUnstartedDeliverable.dueDate,
        newDueDate: mockStartedDeliverable.dueDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });
});

// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Types
import { DeepPartial } from "../../testUtilities";
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
  getDeliverable: vi.fn(),
  validateStartDeliverableReviewInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  validateStartDeliverableReviewInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

describe("startDeliverableReview", () => {
  // Test inputs
  const testDeliverableId = "b18cf1ce-3e41-4a71-b4f4-585f343bc74f";
  const testUserContext: DeepPartial<GraphQLContext> = {
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
  const mockNow = new Date(2026, 3, 27, 10, 4, 19, 232);

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(getDeliverable).mockResolvedValue(mockUnstartedDeliverable as PrismaDeliverable);
    vi.mocked(editDeliverable).mockResolvedValue(mockStartedDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should check that the user is allowed to do this operation", async () => {
    await startDeliverableReview(testDeliverableId, testUserContext as GraphQLContext);
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testUserContext,
      "startDeliverableReview",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await startDeliverableReview(testDeliverableId, testUserContext as GraphQLContext);
      throw new Error("Expected startDeliverableReview to throw, but it did not.");
    } catch {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await startDeliverableReview(testDeliverableId, testUserContext as GraphQLContext);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should call the validator on the unchanged deliverable", async () => {
    await startDeliverableReview(testDeliverableId, testUserContext as GraphQLContext);
    expect(validateStartDeliverableReviewInput).toHaveBeenCalledExactlyOnceWith(
      mockUnstartedDeliverable
    );
  });

  it("should call edit function to set the status to under CMS review", async () => {
    await startDeliverableReview(testDeliverableId, testUserContext as GraphQLContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { statusId: "Under CMS Review" },
      mockTransaction
    );
  });

  it("should log an action for the submission", async () => {
    await startDeliverableReview(testDeliverableId, testUserContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Started Review",
        actionTime: mockNow,
        oldStatus: mockUnstartedDeliverable.statusId,
        newStatus: mockStartedDeliverable.statusId,
        oldDueDate: mockUnstartedDeliverable.dueDate,
        newDueDate: mockStartedDeliverable.dueDate,
        userId: testUserContext.user!.id,
      },
      mockTransaction
    );
  });
});

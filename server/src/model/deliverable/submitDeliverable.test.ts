// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Types
import { DeepPartial } from "../../testUtilities";
import { GraphQLContext } from "../../auth";
import { Deliverable as PrismaDeliverable } from "@prisma/client";

// Functions under test
import { submitDeliverable } from "./submitDeliverable";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  editDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
  validateSubmitDeliverableInput: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { editDeliverable, getDeliverable, validateSubmitDeliverableInput } from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

describe("submitDeliverable", () => {
  // Test inputs
  const testDeliverableId = "b18cf1ce-3e41-4a71-b4f4-585f343bc74f";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
    },
  };

  // Mock results
  const mockUnsubmittedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Upcoming",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockSubmittedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Submitted",
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
    vi.mocked(getDeliverable).mockResolvedValue(mockUnsubmittedDeliverable as PrismaDeliverable);
    vi.mocked(editDeliverable).mockResolvedValue(mockSubmittedDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should get the deliverable before making changes", async () => {
    await submitDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should call the validator on the unchanged deliverable", async () => {
    await submitDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(validateSubmitDeliverableInput).toHaveBeenCalledExactlyOnceWith(
      mockUnsubmittedDeliverable,
      mockTransaction
    );
  });

  it("should call edit function to set the status to submitted", async () => {
    await submitDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { statusId: "Submitted" },
      mockTransaction
    );
  });

  it("should log an action for the submission", async () => {
    await submitDeliverable(testDeliverableId, testContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Submitted Deliverable",
        actionTime: mockNow,
        oldStatus: mockUnsubmittedDeliverable.statusId,
        newStatus: mockSubmittedDeliverable.statusId,
        oldDueDate: mockUnsubmittedDeliverable.dueDate,
        newDueDate: mockSubmittedDeliverable.dueDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });
});

// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";
import { Deliverable as PrismaDeliverable } from "@prisma/client";

// Functions under test
import { completeDeliverable } from "./completeDeliverable";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  editDeliverable: vi.fn(),
  selectDeliverableOrThrow: vi.fn(),
  validateCompleteDeliverableInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

vi.mock("../../services/emailQueue", () => ({
  buildRealtimeEmailEnvelope: vi.fn((input) => ({ ...input })),
  enqueueRealtimeEmail: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  selectDeliverableOrThrow,
  validateCompleteDeliverableInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { buildRealtimeEmailEnvelope, enqueueRealtimeEmail } from "../../services/emailQueue";

describe("completeDeliverable", () => {
  // Test inputs
  const testDeliverableId = "b18cf1ce-3e41-4a71-b4f4-585f343bc74f";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "0a3bd415-39a3-4f72-a067-418a5219216a",
      personTypeId: "demos-admin",
    },
  };

  // Mock results
  const mockIncompleteDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Under CMS Review",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockCompleteDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    name: "My Deliverable",
    deliverableTypeId: "Close Out Report",
    demonstrationId: "demo-1",
    cmsOwnerUserId: "owner-1",
    statusId: "Approved",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    demonstration: {
      findUniqueOrThrow: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(selectDeliverableOrThrow).mockResolvedValue(
      mockIncompleteDeliverable as PrismaDeliverable
    );
    vi.mocked(editDeliverable).mockResolvedValue(mockCompleteDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    mockPrismaClient.user.findUniqueOrThrow.mockResolvedValue({
      person: {
        email: "owner@example.com",
      },
    });
    mockPrismaClient.demonstration.findUniqueOrThrow.mockResolvedValue({
      id: "demo-1",
      name: "Demo",
      stateId: "CA",
    });
  });

  it("should check that the user is allowed to do this operation", async () => {
    await completeDeliverable(testDeliverableId, "Approved", testContext as GraphQLContext);
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testContext,
      "completeDeliverable",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await completeDeliverable(testDeliverableId, "Approved", testContext as GraphQLContext);
      throw new Error("Expected completeDeliverable to throw, but it did not.");
    } catch {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await completeDeliverable(testDeliverableId, "Approved", testContext as GraphQLContext);
    expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should call the validator on the unchanged deliverable", async () => {
    await completeDeliverable(testDeliverableId, "Approved", testContext as GraphQLContext);
    expect(validateCompleteDeliverableInput).toHaveBeenCalledExactlyOnceWith(
      mockIncompleteDeliverable,
      mockTransaction
    );
  });

  it("should call edit function to set the status to the passed value", async () => {
    await completeDeliverable(testDeliverableId, "Approved", testContext as GraphQLContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { statusId: "Approved" },
      mockTransaction
    );
  });

  it("should log an action for the completion", async () => {
    await completeDeliverable(testDeliverableId, "Approved", testContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Approved Deliverable",
        oldStatus: mockIncompleteDeliverable.statusId,
        newStatus: mockCompleteDeliverable.statusId,
        oldDueDate: mockIncompleteDeliverable.dueDate,
        newDueDate: mockCompleteDeliverable.dueDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });

  it("should map accepted to the correct action type", async () => {
    await completeDeliverable(testDeliverableId, "Accepted", testContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Accepted Deliverable",
        oldStatus: mockIncompleteDeliverable.statusId,
        newStatus: mockCompleteDeliverable.statusId,
        oldDueDate: mockIncompleteDeliverable.dueDate,
        newDueDate: mockCompleteDeliverable.dueDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });

  it("should map received and filed to the correct action type", async () => {
    await completeDeliverable(
      testDeliverableId,
      "Received and Filed",
      testContext as GraphQLContext
    );
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Received and Filed Deliverable",
        oldStatus: mockIncompleteDeliverable.statusId,
        newStatus: mockCompleteDeliverable.statusId,
        oldDueDate: mockIncompleteDeliverable.dueDate,
        newDueDate: mockCompleteDeliverable.dueDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });

  it("should enqueue realtime final-status email", async () => {
    await completeDeliverable(testDeliverableId, "Approved", testContext as GraphQLContext);
    expect(buildRealtimeEmailEnvelope).toHaveBeenCalledOnce();
    expect(enqueueRealtimeEmail).toHaveBeenCalledOnce();
  });
});

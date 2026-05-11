// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { DeepPartial } from "../../testUtilities";

// Types
import { ParsedApproveDeliverableExtensionInput } from "./parseDeliverableInputs";
import { ApproveDeliverableExtensionInput, DeliverableExtensionStatus } from "../../types";
import { GraphQLContext } from "../../auth";
import {
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
} from "@prisma/client";

// Functions under test
import { approveDeliverableExtension } from "./approveDeliverableExtension";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  editDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
  parseApproveDeliverableExtensionInput: vi.fn(),
  validateApproveDeliverableExtensionInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

vi.mock("../deliverableExtension/queries", () => ({
  selectDeliverableExtension: vi.fn(),
  updateDeliverableExtension: vi.fn(),
}));

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  parseApproveDeliverableExtensionInput,
  validateApproveDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";
import {
  selectDeliverableExtension,
  updateDeliverableExtension,
} from "../deliverableExtension/queries";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";

describe("approveDeliverableExtension", () => {
  // Test inputs
  const testDeliverableId = "9693437d-1f31-402c-bccb-ab2a5690ea30";
  const testDeliverableExtensionId = "8f86afb2-5013-4334-b8a3-6cf8098ee781";
  const testUserContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "0a3bd415-39a3-4f72-a067-418a5219216a",
      personTypeId: "demos-admin",
    },
  };
  const testInput: ApproveDeliverableExtensionInput = {
    deliverableExtensionId: testDeliverableExtensionId,
    newDueDate: new Date(2026, 9, 29, 4, 59, 59, 999),
  };

  // Mock results
  const mockUnapprovedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Upcoming",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockApprovedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Upcoming",
    dueDate: new Date(2026, 9, 29, 4, 59, 59, 999),
  };
  const mockUnapprovedDeliverableExtension: Partial<PrismaDeliverableExtension> = {
    id: testDeliverableExtensionId,
    statusId: "Requested" satisfies DeliverableExtensionStatus,
  };
  const mockParsedInput: ParsedApproveDeliverableExtensionInput = {
    deliverableExtensionId: testDeliverableExtensionId,
    finalDateGranted: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2026, 9, 28, 23, 59, 59, 999, "America/New_York"),
    },
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(getDeliverable).mockResolvedValue(mockUnapprovedDeliverable as PrismaDeliverable);
    vi.mocked(selectDeliverableExtension).mockResolvedValue(
      mockUnapprovedDeliverableExtension as PrismaDeliverableExtension
    );
    vi.mocked(parseApproveDeliverableExtensionInput).mockReturnValue(mockParsedInput);
    vi.mocked(editDeliverable).mockResolvedValue(mockApprovedDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should check that the user is allowed to do this operation", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testUserContext,
      "approveDeliverableExtension",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should check that the date field isn't null if it's provided", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(["newDueDate"], testInput);
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await approveDeliverableExtension(
        testDeliverableId,
        testInput,
        testUserContext as GraphQLContext
      );
      throw new Error("Expected approveDeliverableExtension to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should not create a transaction if the date field check throws", async () => {
    vi.mocked(checkOptionalNotNullFields).mockThrow("I'm throwing!");

    try {
      await approveDeliverableExtension(
        testDeliverableId,
        testInput,
        testUserContext as GraphQLContext
      );
      throw new Error("Expected approveDeliverableExtension to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      {
        id: testDeliverableId,
      },
      { tx: mockTransaction }
    );
  });

  it("should get the deliverable extension before making changes", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(selectDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableExtensionId },
      true,
      mockTransaction
    );
  });

  it("should call the parser with the unchanged extension and the input", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(parseApproveDeliverableExtensionInput).toHaveBeenCalledExactlyOnceWith(
      testInput,
      mockUnapprovedDeliverableExtension
    );
  });

  it("should call the validator using the parsed input and the unchanged records", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(validateApproveDeliverableExtensionInput).toHaveBeenCalledExactlyOnceWith(
      mockUnapprovedDeliverable,
      mockUnapprovedDeliverableExtension,
      mockParsedInput
    );
  });

  it("should update the deliverable with the correct status and due date", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      {
        statusId: mockUnapprovedDeliverable.statusId,
        dueDate: mockParsedInput.finalDateGranted.easternTZDate,
      },
      mockTransaction
    );
  });

  it("should handle changing Past Due to Upcoming", async () => {
    const mockUnapprovedDeliverable: Partial<PrismaDeliverable> = {
      id: testDeliverableId,
      statusId: "Past Due",
      dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
    };
    vi.mocked(getDeliverable).mockResolvedValue(mockUnapprovedDeliverable as PrismaDeliverable);

    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      {
        statusId: "Upcoming",
        dueDate: mockParsedInput.finalDateGranted.easternTZDate,
      },
      mockTransaction
    );
  });

  it("should insert an action record for the approval", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Approved Extension Request",
        oldStatus: mockUnapprovedDeliverable.statusId,
        newStatus: mockApprovedDeliverable.statusId,
        oldDueDate: mockUnapprovedDeliverable.dueDate,
        newDueDate: mockParsedInput.finalDateGranted.easternTZDate,
        userId: testUserContext.user!.id,
      },
      mockTransaction
    );
  });

  it("should update the deliverable extension", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(updateDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
      testDeliverableExtensionId,
      {
        statusId: "Approved",
        finalDateGranted: mockParsedInput.finalDateGranted.easternTZDate,
      },
      mockTransaction
    );
  });

  it("should invoke the updates to tables in the right order", async () => {
    await approveDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );

    // Note that when resetAllMocks is called, the invocationCallOrder array is emptied
    // That is why we can compare the 0 index of each of them
    const editDeliverableCallIndex = vi.mocked(editDeliverable).mock.invocationCallOrder[0];
    const insertDeliverableActionCallIndex =
      vi.mocked(insertDeliverableAction).mock.invocationCallOrder[0];
    const updateDeliverableExtensionCallIndex = vi.mocked(updateDeliverableExtension).mock
      .invocationCallOrder[0];
    expect(editDeliverableCallIndex).toBeLessThan(insertDeliverableActionCallIndex);
    expect(insertDeliverableActionCallIndex).toBeLessThan(updateDeliverableExtensionCallIndex);
  });
});

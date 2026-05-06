// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { DeepPartial } from "../../testUtilities";
import { GraphQLContext } from "../../auth";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DateTimeOrLocalDate, RequestDeliverableResubmissionInput } from "../../types";

// Functions under test
import { requestDeliverableResubmission } from "./requestDeliverableResubmission";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  editDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
  parseRequestDeliverableResubmissionInput: vi.fn(),
  validateRequestDeliverableResubmissionInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  ParsedRequestDeliverableResubmissionInput,
  parseRequestDeliverableResubmissionInput,
  validateRequestDeliverableResubmissionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";

describe("requestDeliverableResubmission", () => {
  // Test inputs
  const testDeliverableId = "b18cf1ce-3e41-4a71-b4f4-585f343bc74f";
  const testInput: RequestDeliverableResubmissionInput = {
    details: "These are details",
    newDueDate: "2026-11-13" as DateTimeOrLocalDate,
  };
  const testUserContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "0a3bd415-39a3-4f72-a067-418a5219216a",
      personTypeId: "demos-admin",
    },
  };

  // Mock results
  const mockUnrequestedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Submitted",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockRequestedDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Under CMS Review",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockParsedInput: ParsedRequestDeliverableResubmissionInput = {
    details: testInput.details,
    newDueDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2026, 10, 13, 4, 59, 59, 999, "America/New_York"),
    },
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
    vi.mocked(parseRequestDeliverableResubmissionInput).mockReturnValue(mockParsedInput);
    vi.mocked(getDeliverable).mockResolvedValue(mockUnrequestedDeliverable as PrismaDeliverable);
    vi.mocked(editDeliverable).mockResolvedValue(mockRequestedDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should check that the user is allowed to do this operation", async () => {
    await requestDeliverableResubmission(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testUserContext,
      "requestDeliverableResubmission",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await requestDeliverableResubmission(
        testDeliverableId,
        testInput,
        testUserContext as GraphQLContext
      );
      throw new Error("Expected requestDeliverableResubmission to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should parse the input received", async () => {
    await requestDeliverableResubmission(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(parseRequestDeliverableResubmissionInput).toHaveBeenCalledExactlyOnceWith(testInput);
  });

  it("should not create a transaction parsing fails", async () => {
    vi.mocked(parseRequestDeliverableResubmissionInput).mockThrow("I'm throwing!");

    try {
      await requestDeliverableResubmission(
        testDeliverableId,
        testInput,
        testUserContext as GraphQLContext
      );
      throw new Error("Expected requestDeliverableResubmission to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await requestDeliverableResubmission(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should call the validator on the unchanged deliverable", async () => {
    await requestDeliverableResubmission(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(validateRequestDeliverableResubmissionInput).toHaveBeenCalledExactlyOnceWith(
      mockUnrequestedDeliverable,
      mockParsedInput
    );
  });

  it("should call edit function to set the status to upcoming and the due date to the new value", async () => {
    await requestDeliverableResubmission(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { statusId: "Upcoming", dueDate: mockParsedInput.newDueDate.easternTZDate },
      mockTransaction
    );
  });

  it("should log an action for the resubmission request", async () => {
    await requestDeliverableResubmission(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Requested Resubmission",
        actionTime: mockNow,
        oldStatus: mockUnrequestedDeliverable.statusId,
        newStatus: mockRequestedDeliverable.statusId,
        note: mockParsedInput.details,
        oldDueDate: mockUnrequestedDeliverable.dueDate,
        newDueDate: mockRequestedDeliverable.dueDate,
        userId: testUserContext.user!.id,
      },
      mockTransaction
    );
  });
});

// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Types
import { DateTimeOrLocalDate, RequestDeliverableExtensionInput } from "../../types";
import { DeepPartial } from "../../testUtilities";
import { GraphQLContext } from "../../auth";
import { Deliverable as PrismaDeliverable } from "@prisma/client";

// Functions under test
import { requestDeliverableExtension } from "./requestDeliverableExtension";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  getDeliverable: vi.fn(),
  parseRequestDeliverableExtensionInput: vi.fn(),
  validateRequestDeliverableExtensionInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

vi.mock("../deliverableExtension/queries", () => ({
  insertDeliverableExtension: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  getDeliverable,
  ParsedRequestDeliverableExtensionInput,
  parseRequestDeliverableExtensionInput,
  validateRequestDeliverableExtensionInput,
  validateUserPersonTypeAllowed,
} from ".";
import { insertDeliverableAction } from "../deliverableAction/queries";
import { insertDeliverableExtension } from "../deliverableExtension/queries";
import { TZDate } from "@date-fns/tz";

describe("requestDeliverableExtension", () => {
  // Test inputs
  const testDeliverableId = "b18cf1ce-3e41-4a71-b4f4-585f343bc74f";
  const testInput: RequestDeliverableExtensionInput = {
    reason: "COVID-19",
    details: "COVID-19 caused major delays in processing our requests.",
    newDueDate: "2026-12-14" as DateTimeOrLocalDate,
  };
  const testUserContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "0a3bd415-39a3-4f72-a067-418a5219216a",
      personTypeId: "demos-admin",
    },
  };

  // Mock results
  const mockDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    statusId: "Past Due",
    dueDate: new Date(2026, 9, 13, 4, 59, 59, 999),
  };
  const mockParsedInput: ParsedRequestDeliverableExtensionInput = {
    reason: testInput.reason,
    details: testInput.details,
    newDueDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2026, 9, 12, 23, 59, 59, 999, "America/New_York"),
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
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    vi.mocked(parseRequestDeliverableExtensionInput).mockReturnValue(mockParsedInput);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should check that the user is allowed to do this operation", async () => {
    await requestDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testUserContext,
      "requestDeliverableExtension",
      ["demos-state-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await requestDeliverableExtension(
        testDeliverableId,
        testInput,
        testUserContext as GraphQLContext
      );
      throw new Error("Expected requestDeliverableExtension to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should parse the input received", async () => {
    await requestDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(parseRequestDeliverableExtensionInput).toHaveBeenCalledExactlyOnceWith(testInput);
  });

  it("should not create a transaction parsing fails", async () => {
    vi.mocked(parseRequestDeliverableExtensionInput).mockThrow("I'm throwing!");

    try {
      await requestDeliverableExtension(
        testDeliverableId,
        testInput,
        testUserContext as GraphQLContext
      );
      throw new Error("Expected requestDeliverableExtension to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should get the deliverable before making changes", async () => {
    await requestDeliverableExtension(
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
    await requestDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(validateRequestDeliverableExtensionInput).toHaveBeenCalledExactlyOnceWith(
      mockDeliverable,
      mockParsedInput,
      mockTransaction
    );
  });

  it("should call the insert function to retrieve a new extension", async () => {
    await requestDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(insertDeliverableExtension).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        reasonCode: mockParsedInput.reason,
        requestedDate: mockParsedInput.newDueDate.easternTZDate,
      },
      mockTransaction
    );
  });

  it("should log an action for the resubmission request", async () => {
    await requestDeliverableExtension(
      testDeliverableId,
      testInput,
      testUserContext as GraphQLContext
    );
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Requested Extension",
        actionTime: mockNow,
        oldStatus: mockDeliverable.statusId,
        newStatus: mockDeliverable.statusId,
        note: mockParsedInput.details,
        oldDueDate: mockDeliverable.dueDate,
        newDueDate: mockDeliverable.dueDate,
        userId: testUserContext.user!.id,
      },
      mockTransaction
    );
  });
});

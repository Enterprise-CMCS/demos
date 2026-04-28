// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { DeepPartial } from "../../testUtilities";
import { CreateDeliverableInput, DateTimeOrLocalDate, DeliverableType } from "../../types";
import { ParsedCreateDeliverableInput } from ".";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util";

// Functions under test
import { createDeliverable } from "./createDeliverable";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  parseCreateDeliverableInput: vi.fn(),
  validateCreateDeliverableInput: vi.fn(),
  validateUserPersonTypeAllowed: vi.fn(),
  insertDeliverable: vi.fn(),
}));

vi.mock("../deliverableDemonstrationType", () => ({
  setDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  parseCreateDeliverableInput,
  validateCreateDeliverableInput,
  validateUserPersonTypeAllowed,
  insertDeliverable,
} from ".";
import { setDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";
import { insertDeliverableAction } from "../deliverableAction/queries";

describe("createDeliverable", () => {
  // Test inputs
  const testInput: CreateDeliverableInput = {
    name: "A test name",
    deliverableType: "Close Out Report" satisfies DeliverableType,
    demonstrationId: "7cd6cd0f-e3de-47a0-9faa-32343020c955",
    cmsOwnerUserId: "500e9bef-8745-4209-ac73-0a87fa5f888b",
    dueDate: "2025-11-21" as DateTimeOrLocalDate,
  };
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
      personTypeId: "demos-cms-user",
    },
  };

  // Mock return values
  const mockCurrentDate = new Date(2025, 3, 17, 14, 33, 19, 205);
  const mockParsedInput: ParsedCreateDeliverableInput = {
    name: testInput.name,
    deliverableType: testInput.deliverableType,
    demonstrationId: testInput.demonstrationId,
    cmsOwnerUserId: testInput.cmsOwnerUserId,
    dueDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 10, 21, 23, 59, 59, 999, "America/New_York"),
    },
  };
  const mockNewDeliverable: Partial<PrismaDeliverable> = {
    id: "2563ded3-b5c5-4d89-9ee4-0a9bc072e89e",
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockCurrentDate);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(parseCreateDeliverableInput).mockReturnValue(mockParsedInput);
    vi.mocked(insertDeliverable).mockResolvedValue(mockNewDeliverable as PrismaDeliverable);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should check that the user is allowed to do this operation", async () => {
    await createDeliverable(testInput, testContext as GraphQLContext);
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testContext,
      "createDeliverable",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await createDeliverable(testInput, testContext as GraphQLContext);
      throw new Error("Expected createDeliverable to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should parse the input to process dates", async () => {
    await createDeliverable(testInput, testContext as GraphQLContext);
    expect(parseCreateDeliverableInput).toHaveBeenCalledExactlyOnceWith(testInput);
  });

  it("should call the validation function with a transaction", async () => {
    await createDeliverable(testInput, testContext as GraphQLContext);
    expect(validateCreateDeliverableInput).toHaveBeenCalledExactlyOnceWith(
      mockParsedInput,
      mockTransaction
    );
  });

  it("should call the insert function with a transaction", async () => {
    await createDeliverable(testInput, testContext as GraphQLContext);
    expect(insertDeliverable).toHaveBeenCalledExactlyOnceWith(mockParsedInput, mockTransaction);
  });

  it("should use an empty list if no demonstration types are passed", async () => {
    await createDeliverable(testInput, testContext as GraphQLContext);
    expect(setDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: mockNewDeliverable.id,
        demonstrationId: testInput.demonstrationId,
        demonstrationTypes: [],
      },
      mockTransaction
    );
  });

  it("should pass the list of demonstration types if they are present", async () => {
    const expandedTestInput: CreateDeliverableInput = {
      ...testInput,
      demonstrationTypes: ["Healthy Food", "Free Eye Exams"],
    };
    const expandedMockParsedInput: ParsedCreateDeliverableInput = {
      ...mockParsedInput,
      demonstrationTypes: new Set(["Healthy Food", "Free Eye Exams"]),
    };
    vi.mocked(parseCreateDeliverableInput).mockReturnValue(expandedMockParsedInput);

    await createDeliverable(expandedTestInput, testContext as GraphQLContext);
    expect(setDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: mockNewDeliverable.id,
        demonstrationId: expandedTestInput.demonstrationId,
        demonstrationTypes: Array.from(expandedMockParsedInput.demonstrationTypes!),
      },
      mockTransaction
    );
  });

  it("should insert a deliverable action with a transaction", async () => {
    await createDeliverable(testInput, testContext as GraphQLContext);
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: mockNewDeliverable.id,
        actionType: "Created Deliverable Slot",
        actionTime: mockCurrentDate,
        oldStatus: "Upcoming",
        newStatus: "Upcoming",
        oldDueDate: mockParsedInput.dueDate.easternTZDate,
        newDueDate: mockParsedInput.dueDate.easternTZDate,
        userId: testContext.user!.id,
      },
      mockTransaction
    );
  });
});

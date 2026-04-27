// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Types
import { GraphQLContext } from "../../auth/auth.util";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DeliverableStatus } from "../../types";
import { ParsedUpdateDeliverableInput } from ".";

// Functions under test
import { manuallyUpdateDeliverableDueDate } from "./manuallyUpdateDeliverableDueDate";

// Mock imports
vi.mock("../deliverableAction/queries", () => ({
  insertDeliverableAction: vi.fn(),
}));

vi.mock(".", () => ({
  checkDueDateInFuture: vi.fn(),
  editDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
}));

import { insertDeliverableAction } from "../deliverableAction/queries";
import { checkDueDateInFuture, editDeliverable, getDeliverable } from ".";
import { TZDate } from "@date-fns/tz";

describe("manuallyUpdateDeliverableDueDate", () => {
  // Test inputs
  const testDeliverableId = "03cb9763-1dea-4a40-a449-dc9fbc969c50";
  const testContext: GraphQLContext = {
    user: {
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
      cognitoSubject: "82d0e8e4-82d0-447c-b1bb-52227e49cf51",
      personTypeId: "demos-cms-user",
      permissions: ["View All Demonstrations"],
    },
  };

  // Mock results
  const mockCurrentDate = new Date(2025, 3, 17, 14, 33, 19, 205);
  const mockGeneralDate = new Date(2026, 4, 1, 3, 59, 59, 999);
  const mockDemonstrationId = "6ba5407b-3706-4795-b8a8-3e32e8fa77ac";
  const mockDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    demonstrationId: mockDemonstrationId,
    dueDate: mockGeneralDate,
    statusId: "Under CMS Review" satisfies DeliverableStatus,
  };

  // Mock transaction
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockCurrentDate);
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should do nothing if the test input has no due date", async () => {
    const testInput: ParsedUpdateDeliverableInput = {
      name: "A deliverable!",
    };

    const result = await manuallyUpdateDeliverableDueDate(
      testDeliverableId,
      testInput,
      testContext,
      mockTransaction
    );
    expect(result).toBeUndefined();
    expect(checkDueDateInFuture).not.toHaveBeenCalled();
    expect(getDeliverable).not.toHaveBeenCalled();
    expect(editDeliverable).not.toHaveBeenCalled();
    expect(insertDeliverableAction).not.toHaveBeenCalled();
  });

  it("should throw if given a date that is in the past", async () => {
    vi.mocked(checkDueDateInFuture).mockReturnValue("The future date check failed!");
    const testInput: ParsedUpdateDeliverableInput = {
      name: "A deliverable!",
      dueDate: {
        newDueDate: {
          isEasternTZDate: true,
          easternTZDate: new TZDate(2023, 3, 30, 0, 0, 0, 0, "America/New_York"),
        },
        dateChangeNote: "State requires more time to implement the Free Insulin program",
      },
    };

    try {
      await manuallyUpdateDeliverableDueDate(
        testDeliverableId,
        testInput,
        testContext,
        mockTransaction
      );
      throw new Error("Expected manuallyUpdateDeliverableDueDate to throw, but it did not.");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      const error = e as Error;
      expect(error.message).toBe("The future date check failed!");
    }
    expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testInput.dueDate!.newDueDate);
    expect(getDeliverable).not.toHaveBeenCalled();
    expect(editDeliverable).not.toHaveBeenCalled();
    expect(insertDeliverableAction).not.toHaveBeenCalled();
  });

  it("should do nothing if the new and old dates are the same", async () => {
    const testInput: ParsedUpdateDeliverableInput = {
      name: "A deliverable!",
      dueDate: {
        newDueDate: {
          isEasternTZDate: true,
          easternTZDate: new TZDate(2026, 3, 30, 23, 59, 59, 999, "America/New_York"),
        },
        dateChangeNote: "State requires more time to implement the Free Insulin program",
      },
    };

    await manuallyUpdateDeliverableDueDate(
      testDeliverableId,
      testInput,
      testContext,
      mockTransaction
    );
    expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testInput.dueDate!.newDueDate);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(editDeliverable).not.toHaveBeenCalled();
    expect(insertDeliverableAction).not.toHaveBeenCalled();
  });

  it("should use the existing status when it is not Past Due", async () => {
    const testInput: ParsedUpdateDeliverableInput = {
      name: "A deliverable!",
      dueDate: {
        newDueDate: {
          isEasternTZDate: true,
          easternTZDate: new TZDate(2026, 8, 30, 23, 59, 59, 999, "America/New_York"),
        },
        dateChangeNote: "State requires more time to implement the Free Insulin program",
      },
    };

    await manuallyUpdateDeliverableDueDate(
      testDeliverableId,
      testInput,
      testContext,
      mockTransaction
    );
    expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testInput.dueDate!.newDueDate);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      {
        dueDate: testInput.dueDate!.newDueDate.easternTZDate,
        statusId: mockDeliverable.statusId,
      },
      mockTransaction
    );
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Manually Changed Due Date",
        actionTime: mockCurrentDate,
        oldStatus: mockDeliverable.statusId,
        newStatus: mockDeliverable.statusId,
        note: testInput.dueDate!.dateChangeNote,
        oldDueDate: mockDeliverable.dueDate,
        newDueDate: testInput.dueDate!.newDueDate.easternTZDate,
        userId: testContext.user.id,
      },
      mockTransaction
    );
  });

  it("should properly set to Upcoming when the status is Past Due", async () => {
    const mockDeliverable: Partial<PrismaDeliverable> = {
      id: testDeliverableId,
      demonstrationId: mockDemonstrationId,
      dueDate: mockGeneralDate,
      statusId: "Past Due" satisfies DeliverableStatus,
    };
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    const testInput: ParsedUpdateDeliverableInput = {
      name: "A deliverable!",
      dueDate: {
        newDueDate: {
          isEasternTZDate: true,
          easternTZDate: new TZDate(2026, 8, 30, 23, 59, 59, 999, "America/New_York"),
        },
        dateChangeNote: "State requires more time to implement the Free Insulin program",
      },
    };

    await manuallyUpdateDeliverableDueDate(
      testDeliverableId,
      testInput,
      testContext,
      mockTransaction
    );
    expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testInput.dueDate!.newDueDate);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      {
        dueDate: testInput.dueDate!.newDueDate.easternTZDate,
        statusId: "Upcoming",
      },
      mockTransaction
    );
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        actionType: "Manually Changed Due Date",
        actionTime: mockCurrentDate,
        oldStatus: "Past Due",
        newStatus: "Upcoming",
        note: testInput.dueDate!.dateChangeNote,
        oldDueDate: mockDeliverable.dueDate,
        newDueDate: testInput.dueDate!.newDueDate.easternTZDate,
        userId: testContext.user.id,
      },
      mockTransaction
    );
  });
});

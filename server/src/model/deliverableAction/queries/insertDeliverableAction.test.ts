// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeliverableActionType as PrismaDeliverableActionType } from "@prisma/client";

// Types
import { DeliverableAction } from "..";

// Functions under test
import { insertDeliverableAction } from "./insertDeliverableAction";

// Mock imports
vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient.js";

describe("insertDeliverableAction", () => {
  // Test inputs
  const testInput: DeliverableAction = {
    deliverableId: "c25385d4-d5e3-4e27-aaf3-7dfa87f677d3",
    actionType: "Created Deliverable Slot",
    actionTime: new Date(2025, 6, 11, 12, 1, 53, 299),
    oldStatus: "Upcoming",
    newStatus: "Upcoming",
    oldDueDate: new Date(2025, 8, 13, 0, 0, 0, 0),
    newDueDate: new Date(2025, 8, 13, 0, 0, 0, 0),
    userId: "2dbf034d-a525-4578-a648-c412544a7932",
  };

  // Mock return values
  const mockCurrentDate = new Date(2024, 7, 19, 20, 10, 55, 181);
  const regularMocks = {
    deliverableActionType: {
      findUniqueOrThrow: vi.fn(),
    },
    deliverableAction: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableActionType: {
      findUniqueOrThrow: regularMocks.deliverableActionType.findUniqueOrThrow,
    },
    deliverableAction: {
      create: regularMocks.deliverableAction.create,
    },
  };

  const transactionMocks = {
    deliverableActionType: {
      findUniqueOrThrow: vi.fn(),
    },
    deliverableAction: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableActionType: {
      findUniqueOrThrow: transactionMocks.deliverableActionType.findUniqueOrThrow,
    },
    deliverableAction: {
      create: transactionMocks.deliverableAction.create,
    },
  } as any;

  const mockDeliverableActionType: PrismaDeliverableActionType = {
    id: testInput.actionType,
    dueDateChangeAllowed: false,
    shouldHaveNote: false,
    shouldHaveUserId: true,
  };

  // Expected calls
  const expectedFindCall = {
    where: {
      id: testInput.actionType,
    },
  };
  const expectedCreateCall = {
    data: {
      actionTimestamp: mockCurrentDate,
      deliverableId: testInput.deliverableId,
      actionTypeId: testInput.actionType,
      oldStatusId: testInput.oldStatus,
      newStatusId: testInput.newStatus,
      note: testInput.note,
      dueDateChangeAllowed: mockDeliverableActionType.dueDateChangeAllowed,
      shouldHaveNote: mockDeliverableActionType.shouldHaveNote,
      shouldHaveUserId: mockDeliverableActionType.shouldHaveUserId,
      oldDueDate: testInput.oldDueDate,
      newDueDate: testInput.newDueDate,
      userId: testInput.userId,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockCurrentDate);
    regularMocks.deliverableActionType.findUniqueOrThrow.mockReturnValue(mockDeliverableActionType);
    transactionMocks.deliverableActionType.findUniqueOrThrow.mockReturnValue(
      mockDeliverableActionType
    );
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should insert the new deliverable action using a new client if no transaction is given", async () => {
    await insertDeliverableAction(testInput);
    expect(regularMocks.deliverableActionType.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedFindCall
    );
    expect(regularMocks.deliverableAction.create).toHaveBeenCalledExactlyOnceWith(
      expectedCreateCall
    );
    expect(transactionMocks.deliverableActionType.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableAction.create).not.toHaveBeenCalled();
  });

  it("should insert the deliverable action via a transaction if one is given", async () => {
    await insertDeliverableAction(testInput, mockTransaction);
    expect(regularMocks.deliverableActionType.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(regularMocks.deliverableAction.create).not.toHaveBeenCalled();
    expect(
      transactionMocks.deliverableActionType.findUniqueOrThrow
    ).toHaveBeenCalledExactlyOnceWith(expectedFindCall);
    expect(transactionMocks.deliverableAction.create).toHaveBeenCalledExactlyOnceWith(
      expectedCreateCall
    );
  });
});

// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApplicationActionType as PrismaApplicationActionType } from "@prisma/client";

// Types
import { InsertApplicationActionInput } from ".";

// Functions under test
import { insertApplicationAction } from "./insertApplicationAction";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient";

describe("insertApplicationAction", () => {
  // Test inputs
  const testInput: InsertApplicationActionInput = {
    applicationId: "c25385d4-d5e3-4e27-aaf3-7dfa87f677d3",
    actionType: "Set Application Date",
    userId: "2dbf034d-a525-4578-a648-c412544a7932",
  };

  // Mock return values
  const mockCurrentDate = new Date(2024, 7, 19, 20, 10, 55, 181);
  const regularMocks = {
    applicationActionType: {
      findUniqueOrThrow: vi.fn(),
    },
    applicationAction: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    applicationActionType: {
      findUniqueOrThrow: regularMocks.applicationActionType.findUniqueOrThrow,
    },
    applicationAction: {
      create: regularMocks.applicationAction.create,
    },
  };

  const transactionMocks = {
    applicationActionType: {
      findUniqueOrThrow: vi.fn(),
    },
    applicationAction: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationActionType: {
      findUniqueOrThrow: transactionMocks.applicationActionType.findUniqueOrThrow,
    },
    applicationAction: {
      create: transactionMocks.applicationAction.create,
    },
  } as any;

  const mockApplicationActionType: PrismaApplicationActionType = {
    id: testInput.actionType,
    shouldHaveUserId: true,
    shouldHaveDateTypeId: false,
    shouldHaveNoteTypeId: false,
    shouldHaveDocumentTypeId: false,
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
      applicationId: testInput.applicationId,
      actionTypeId: testInput.actionType,
      dateTypeId: undefined,
      noteTypeId: undefined,
      documentTypeId: undefined,
      shouldHaveUserId: mockApplicationActionType.shouldHaveUserId,
      shouldHaveDateTypeId: mockApplicationActionType.shouldHaveDateTypeId,
      shouldHaveNoteTypeId: mockApplicationActionType.shouldHaveNoteTypeId,
      shouldHaveDocumentTypeId: mockApplicationActionType.shouldHaveDocumentTypeId,
      userId: testInput.userId,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockCurrentDate);
    regularMocks.applicationActionType.findUniqueOrThrow.mockReturnValue(mockApplicationActionType);
    transactionMocks.applicationActionType.findUniqueOrThrow.mockReturnValue(
      mockApplicationActionType
    );
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should insert the new application action using a new client if no transaction is given", async () => {
    await insertApplicationAction(testInput);
    expect(regularMocks.applicationActionType.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedFindCall
    );
    expect(regularMocks.applicationAction.create).toHaveBeenCalledExactlyOnceWith(
      expectedCreateCall
    );
    expect(transactionMocks.applicationActionType.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.applicationAction.create).not.toHaveBeenCalled();
  });

  it("should insert the application action via a transaction if one is given", async () => {
    await insertApplicationAction(testInput, mockTransaction);
    expect(regularMocks.applicationActionType.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(regularMocks.applicationAction.create).not.toHaveBeenCalled();
    expect(
      transactionMocks.applicationActionType.findUniqueOrThrow
    ).toHaveBeenCalledExactlyOnceWith(expectedFindCall);
    expect(transactionMocks.applicationAction.create).toHaveBeenCalledExactlyOnceWith(
      expectedCreateCall
    );
  });
});

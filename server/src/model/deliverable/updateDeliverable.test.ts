// Vitest and other helpers
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { UpdateDeliverableInput, DateTimeOrLocalDate, DeliverableType } from "../../types.js";
import { ParsedUpdateDeliverableInput } from ".";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";

// Functions under test
import { updateDeliverable } from "./updateDeliverable";

// Mock imports
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  parseUpdateDeliverableInput: vi.fn(),
  validateUpdateDeliverableInput: vi.fn(),
  prismaUpdateDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
}));

vi.mock("../deliverableDemonstrationType", () => ({
  getDeliverableDemonstrationTypes: vi.fn(),
  setDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock("../deliverableAction", () => ({
  insertDeliverableAction: vi.fn(),
}));

import { prisma } from "../../prismaClient.js";
import {
  parseUpdateDeliverableInput,
  validateUpdateDeliverableInput,
  prismaUpdateDeliverable,
  getDeliverable,
} from ".";
import {
  getDeliverableDemonstrationTypes,
  setDeliverableDemonstrationTypes,
} from "../deliverableDemonstrationType";
import { insertDeliverableAction } from "../deliverableAction";

describe("updateDeliverable", () => {
  // Test inputs
  const testDemonstrationId = "6ba5407b-3706-4795-b8a8-3e32e8fa77ac";
  const testDeliverableId = "2563ded3-b5c5-4d89-9ee4-0a9bc072e89e";
  const testBaseInput: UpdateDeliverableInput = {
    name: "An updated name",
  };
  const testContext: GraphQLContext = {
    user: {
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
      cognitoSubject: "82d0e8e4-82d0-447c-b1bb-52227e49cf51",
      personTypeId: "demos-cms-user",
      permissions: ["View All Demonstrations"],
    },
  };

  // Mock return values
  const mockCurrentDate = new Date(2025, 3, 17, 14, 33, 19, 205);
  const mockBaseParsedInput: ParsedUpdateDeliverableInput = {
    name: "An updated name",
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
    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockBaseParsedInput);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should parse the input to process dates", async () => {
    await updateDeliverable(testDeliverableId, testBaseInput, testContext);
    expect(parseUpdateDeliverableInput).toHaveBeenCalledExactlyOnceWith(testBaseInput);
  });

  it("should call the validation function with a transaction", async () => {
    await updateDeliverable(testDeliverableId, testBaseInput, testContext);
    expect(validateUpdateDeliverableInput).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBaseParsedInput,
      mockTransaction
    );
  });

  it("should fetch the old deliverable and then run the update within a transaction", async () => {
    await updateDeliverable(testDeliverableId, testBaseInput, testContext);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(prismaUpdateDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBaseParsedInput,
      mockTransaction
    );
  });

  it("should not enter code that deals with demonstration types or dates unless they are present", async () => {
    await updateDeliverable(testDeliverableId, testBaseInput, testContext);
    expect(getDeliverableDemonstrationTypes).not.toHaveBeenCalled();
    expect(setDeliverableDemonstrationTypes).not.toHaveBeenCalled();
    expect(insertDeliverableAction).not.toHaveBeenCalled();
  });

  it("should not process demonstration type changes if they are unchanged", async () => {
    const testInput: UpdateDeliverableInput = {
      name: testBaseInput.name,
      demonstrationTypes: ["Nutritional Counseling for Young Parents", "Free Insulin"],
    };
    const mockDeliverable: Partial<PrismaDeliverable> = {
      id: testDeliverableId,
    };

    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(testInput);
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    vi.mocked(getDeliverableDemonstrationTypes).mockResolvedValue([
      {
        demonstrationId: testDemonstrationId,
        deliverableId: testDeliverableId,
        demonstrationTypeTagNameId: "Free Insulin",
      },
      {
        demonstrationId: testDemonstrationId,
        deliverableId: testDeliverableId,
        demonstrationTypeTagNameId: "Nutritional Counseling for Young Parents",
      },
    ]);

    await updateDeliverable(testDeliverableId, testInput, testContext);
    expect(getDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockTransaction
    );
    expect(setDeliverableDemonstrationTypes).not.toHaveBeenCalled();
    expect(insertDeliverableAction).not.toHaveBeenCalled();
  });

  it("should process demonstration type changes if they changed", async () => {
    const testInput: UpdateDeliverableInput = {
      name: testBaseInput.name,
      demonstrationTypes: ["Free Insulin"],
    };
    const mockDeliverable: Partial<PrismaDeliverable> = {
      id: testDeliverableId,
      demonstrationId: testDemonstrationId,
    };

    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(testInput);
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    vi.mocked(prismaUpdateDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    vi.mocked(getDeliverableDemonstrationTypes).mockResolvedValue([
      {
        demonstrationId: testDemonstrationId,
        deliverableId: testDeliverableId,
        demonstrationTypeTagNameId: "Free Insulin",
      },
      {
        demonstrationId: testDemonstrationId,
        deliverableId: testDeliverableId,
        demonstrationTypeTagNameId: "Nutritional Counseling for Young Parents",
      },
    ]);

    await updateDeliverable(testDeliverableId, testInput, testContext);
    expect(getDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockTransaction
    );
    expect(setDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: mockDeliverable.id,
        demonstrationId: mockDeliverable.demonstrationId,
        demonstrationTypes: testInput.demonstrationTypes,
      },
      mockTransaction
    );
    expect(insertDeliverableAction).not.toHaveBeenCalled();
  });

  it("should process and log date changes if they are included", async () => {
    const testInput: UpdateDeliverableInput = {
      name: testBaseInput.name,
      dueDate: {
        newDueDate: "2025-11-21" as DateTimeOrLocalDate,
        dateChangeNote: "Changed the date",
      },
    };
    const mockParsedInput: ParsedUpdateDeliverableInput = {
      name: testBaseInput.name,
      dueDate: {
        newDueDate: {
          isEasternTZDate: true,
          easternTZDate: new TZDate(2025, 10, 21, 23, 59, 59, 999, "America/New_York"),
        },
        dateChangeNote: testInput.dueDate!.dateChangeNote,
      },
    };
    const mockDeliverable: Partial<PrismaDeliverable> = {
      id: testDeliverableId,
      demonstrationId: testDemonstrationId,
      statusId: "Upcoming",
      dueDate: new Date(2025, 10, 25, 4, 59, 59, 999),
    };

    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockParsedInput);
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    vi.mocked(prismaUpdateDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);

    await updateDeliverable(testDeliverableId, testInput, testContext);
    expect(getDeliverableDemonstrationTypes).not.toHaveBeenCalled();
    expect(setDeliverableDemonstrationTypes).not.toHaveBeenCalled();
    expect(insertDeliverableAction).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: mockDeliverable.id,
        actionType: "Manually Changed Due Date",
        actionTime: mockCurrentDate,
        oldStatus: mockDeliverable.statusId,
        newStatus: mockDeliverable.statusId,
        oldDueDate: mockDeliverable.dueDate,
        newDueDate: mockDeliverable.dueDate,
        userId: testContext.user.id,
      },
      mockTransaction
    );
  });
});

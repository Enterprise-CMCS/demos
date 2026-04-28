// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { DeepPartial } from "../../testUtilities";
import { UpdateDeliverableInput } from "../../types";
import { EditDeliverableInput, ParsedUpdateDeliverableInput } from ".";
import { GraphQLContext } from "../../auth/auth.util";

// Functions under test
import { updateDeliverable } from "./updateDeliverable";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  editDeliverable: vi.fn(),
  getDeliverable: vi.fn(),
  manuallyUpdateDeliverableDueDate: vi.fn(),
  parseUpdateDeliverableInput: vi.fn(),
  updateDeliverableDemonstrationTypes: vi.fn(),
  validateUpdateDeliverableInput: vi.fn(),
}));

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  manuallyUpdateDeliverableDueDate,
  parseUpdateDeliverableInput,
  updateDeliverableDemonstrationTypes,
  validateUpdateDeliverableInput,
} from ".";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";

describe("updateDeliverable", () => {
  // Test inputs
  const testDeliverableId = "2563ded3-b5c5-4d89-9ee4-0a9bc072e89e";
  const testName = "Test Input 1";
  const testCmsOwnerUserId = "7643eef9-dc5e-4640-bc1f-b0a660034386";
  const testInput: UpdateDeliverableInput = {
    name: testName,
  };
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
    },
  };

  // Mock parsed input
  const mockParseInputResult: ParsedUpdateDeliverableInput = {
    name: testInput.name,
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockParseInputResult);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should check for non-null in all the fields", async () => {
    await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
      ["name", "cmsOwnerUserId", "dueDate", "demonstrationTypes"],
      testInput
    );
  });

  it("should parse the input", async () => {
    await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(parseUpdateDeliverableInput).toHaveBeenCalledExactlyOnceWith(testInput);
  });

  it("should call the validation function with a transaction", async () => {
    await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(validateUpdateDeliverableInput).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockParseInputResult,
      mockTransaction
    );
  });

  it("should edit the deliverable and then fetch the final version within a transaction", async () => {
    await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { name: mockParseInputResult.name },
      mockTransaction
    );
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  const editDeliverableInputTests: [string, ParsedUpdateDeliverableInput, EditDeliverableInput][] =
    [
      ["name only", { name: testName }, { name: testName }],
      [
        "cmsOwnerUserId only",
        { cmsOwnerUserId: testCmsOwnerUserId },
        { cmsOwnerUserId: testCmsOwnerUserId },
      ],
      [
        "name + cmsOwnerUserId",
        { name: testName, cmsOwnerUserId: testCmsOwnerUserId },
        { name: testName, cmsOwnerUserId: testCmsOwnerUserId },
      ],
    ];
  it.each(editDeliverableInputTests)(
    "includes only fields present in parsedInput (%s)",
    async (label, mockParseInputResult, expectedEditInput) => {
      // Note that logic is based on results of parseUpdateDeliverableInput
      // That is why this mock is necessary, and needs to change for each set of parameters
      vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockParseInputResult);

      await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
      expect(editDeliverable).toHaveBeenCalledWith(
        testDeliverableId,
        expectedEditInput,
        mockTransaction
      );
    }
  );

  it("should not do a direct update if there is no new name or owner", async () => {
    // Note that logic is based on results of parseUpdateDeliverableInput
    // That is why this mock is necessary
    const mockParseInputResult: ParsedUpdateDeliverableInput = {
      dueDate: {
        newDueDate: {
          isEasternTZDate: true,
          easternTZDate: new TZDate(2025, 0, 13, 10, 44, 8, 2, "America/New_York"),
        },
        dateChangeNote: "A note is required",
      },
    };
    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockParseInputResult);

    await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(editDeliverable).not.toHaveBeenCalled();
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should always call the demonstration type and due date update functions", async () => {
    await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(updateDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockParseInputResult,
      mockTransaction
    );
    expect(manuallyUpdateDeliverableDueDate).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockParseInputResult,
      testContext,
      mockTransaction
    );
  });
});

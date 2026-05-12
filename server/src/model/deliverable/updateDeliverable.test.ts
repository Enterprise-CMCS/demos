// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { DeepPartial } from "../../testUtilities";

// Types
import { PersonType, UpdateDeliverableInput } from "../../types";
import { EditDeliverableInput, ParsedUpdateDeliverableInput } from ".";
import { GraphQLContext } from "../../auth";
import { User as PrismaUser } from "@prisma/client";

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
  validateUserPersonTypeAllowed: vi.fn(),
}));

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

vi.mock("../user/queries", () => ({
  getUser: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import {
  editDeliverable,
  getDeliverable,
  manuallyUpdateDeliverableDueDate,
  parseUpdateDeliverableInput,
  updateDeliverableDemonstrationTypes,
  validateUpdateDeliverableInput,
  validateUserPersonTypeAllowed,
} from ".";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { getUser } from "../user/queries";

describe("updateDeliverable", () => {
  // Test inputs
  const testDeliverableId = "2563ded3-b5c5-4d89-9ee4-0a9bc072e89e";
  const testName = "Test Input 1";
  const testCmsOwnerUserId = "7643eef9-dc5e-4640-bc1f-b0a660034386";
  const testCmsOwnerPersonTypeId: PersonType = "demos-admin";
  const testContext: DeepPartial<GraphQLContext> = {
    user: {
      id: "57f92f14-7c5e-4c78-a774-5a54d7e9c2e7",
    },
  };

  // Basic test input and parsed result with only a name
  // Inputs will be changed when needed for tests
  const basicTestInput: UpdateDeliverableInput = {
    name: testName,
  };
  const mockBasicParseInputResult: ParsedUpdateDeliverableInput = {
    name: testName,
  };

  // Basic mocked user for getUser for when this is used
  const mockUser: Partial<PrismaUser> = {
    id: testCmsOwnerUserId,
    personTypeId: testCmsOwnerPersonTypeId,
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockBasicParseInputResult);
    vi.mocked(getUser).mockResolvedValue(mockUser as PrismaUser);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should check that the user is allowed to do this operation", async () => {
    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(validateUserPersonTypeAllowed).toHaveBeenCalledExactlyOnceWith(
      testContext,
      "updateDeliverable",
      ["demos-admin", "demos-cms-user"]
    );
  });

  it("should not create a transaction if the user is not permitted", async () => {
    vi.mocked(validateUserPersonTypeAllowed).mockThrow("I'm throwing!");

    try {
      await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
      throw new Error("Expected updateDeliverable to throw, but it did not.");
    } catch (e) {
      expect(prisma).not.toHaveBeenCalled();
    }
  });

  it("should check for non-null in all the fields", async () => {
    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
      ["name", "cmsOwnerUserId", "dueDate", "demonstrationTypes"],
      basicTestInput
    );
  });

  it("should parse the input", async () => {
    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(parseUpdateDeliverableInput).toHaveBeenCalledExactlyOnceWith(basicTestInput);
  });

  it("should call the validation function with a transaction", async () => {
    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(validateUpdateDeliverableInput).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBasicParseInputResult,
      mockTransaction
    );
  });

  it("should edit the deliverable and then fetch the final version within a transaction", async () => {
    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      { name: mockBasicParseInputResult.name },
      mockTransaction
    );
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      { tx: mockTransaction }
    );
  });

  it("should get the user record if a user ID is provided", async () => {
    const testInput: UpdateDeliverableInput = {
      ...basicTestInput,
      cmsOwnerUserId: testCmsOwnerUserId,
    };
    const mockParseInputResult: ParsedUpdateDeliverableInput = {
      ...mockBasicParseInputResult,
      cmsOwnerUserId: testInput.cmsOwnerUserId,
    };
    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockParseInputResult);

    await updateDeliverable(testDeliverableId, testInput, testContext as GraphQLContext);
    expect(getUser).toHaveBeenCalledExactlyOnceWith({ id: testCmsOwnerUserId }, mockTransaction);
  });

  it("should not get the user record if a user ID is not provided", async () => {
    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(getUser).not.toHaveBeenCalled();
  });

  const editDeliverableInputTests: [string, ParsedUpdateDeliverableInput, EditDeliverableInput][] =
    [
      ["name only", { name: testName }, { name: testName }],
      [
        "cmsOwnerUserId only",
        { cmsOwnerUserId: testCmsOwnerUserId },
        {
          cmsOwner: {
            cmsOwnerUserId: testCmsOwnerUserId,
            cmsOwnerPersonTypeId: testCmsOwnerPersonTypeId,
          },
        },
      ],
      [
        "name + cmsOwnerUserId",
        { name: testName, cmsOwnerUserId: testCmsOwnerUserId },
        {
          name: testName,
          cmsOwner: {
            cmsOwnerUserId: testCmsOwnerUserId,
            cmsOwnerPersonTypeId: testCmsOwnerPersonTypeId,
          },
        },
      ],
    ];
  it.each(editDeliverableInputTests)(
    "includes only fields present in parsedInput (%s)",
    async (label, mockParseInputResult, expectedEditInput) => {
      // Note that logic is based on results of parseUpdateDeliverableInput
      // That is why this mock is necessary, and needs to change for each set of parameters
      vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockParseInputResult);

      await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
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

    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(editDeliverable).not.toHaveBeenCalled();
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      { tx: mockTransaction }
    );
  });

  it("should always call the demonstration type and due date update functions", async () => {
    await updateDeliverable(testDeliverableId, basicTestInput, testContext as GraphQLContext);
    expect(updateDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBasicParseInputResult,
      mockTransaction
    );
    expect(manuallyUpdateDeliverableDueDate).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBasicParseInputResult,
      testContext,
      mockTransaction
    );
  });
});

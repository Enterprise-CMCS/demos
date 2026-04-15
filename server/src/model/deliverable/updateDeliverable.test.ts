// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { UpdateDeliverableInput, DateTimeOrLocalDate } from "../../types.js";
import { ParsedUpdateDeliverableInput } from ".";
import { GraphQLContext } from "../../auth/auth.util.js";

// Functions under test
import { updateDeliverable } from "./updateDeliverable";

// Mock imports
vi.mock("../../prismaClient.js", () => ({
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

import { prisma } from "../../prismaClient.js";
import {
  editDeliverable,
  getDeliverable,
  manuallyUpdateDeliverableDueDate,
  parseUpdateDeliverableInput,
  updateDeliverableDemonstrationTypes,
  validateUpdateDeliverableInput,
} from ".";

describe("updateDeliverable", () => {
  // Test inputs
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
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(parseUpdateDeliverableInput).mockReturnValue(mockBaseParsedInput);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should parse the input", async () => {
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

  it("should should edit the deliverable and then fetch the final version within a transaction", async () => {
    await updateDeliverable(testDeliverableId, testBaseInput, testContext);
    expect(editDeliverable).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBaseParsedInput,
      mockTransaction
    );
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should not do a direct update if there is no new name, type, or owner", async () => {
    const testInput: UpdateDeliverableInput = {
      dueDate: {
        newDueDate: "2024-11-12" as DateTimeOrLocalDate,
        dateChangeNote: "A note is required",
      },
    };
    await updateDeliverable(testDeliverableId, testInput, testContext);
    expect(editDeliverable).not.toHaveBeenCalled();
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
  });

  it("should always call the demonstration type and due date update functions", async () => {
    await updateDeliverable(testDeliverableId, testBaseInput, testContext);
    expect(updateDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBaseParsedInput,
      mockTransaction
    );
    expect(manuallyUpdateDeliverableDueDate).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
      mockBaseParsedInput,
      testContext,
      mockTransaction
    );
  });
});

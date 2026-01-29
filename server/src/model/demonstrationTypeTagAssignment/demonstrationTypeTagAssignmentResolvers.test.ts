import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetDemonstrationTypesInput } from "../../types";
import { ParsedSetDemonstrationTypesInput } from "./demonstrationTypeTagAssignmentTypes";
import { TZDate } from "@date-fns/tz";
import { setDemonstrationTypes } from "./demonstrationTypeTagAssignmentResolvers";

// Mock imports
import { prisma } from "../../prismaClient";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getApplication } from "../application";
import {
  checkForDuplicateDemonstrationTypes,
  createAndUpsertDemonstrationTypeAssignments,
  deleteDemonstrationTypeAssignments,
  parseSetDemonstrationTypesInput,
} from ".";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock(".", () => ({
  checkForDuplicateDemonstrationTypes: vi.fn(),
  createAndUpsertDemonstrationTypeAssignments: vi.fn(),
  deleteDemonstrationTypeAssignments: vi.fn(),
  parseSetDemonstrationTypesInput: vi.fn(),
}));

describe("demonstrationTypeTagAssignmentResolvers", () => {
  const mockTransaction: any = "Test";
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testDemonstrationId = "3c482b37-182a-4db5-8aea-b58096b452ff";
  const testInputEffectiveDates = [
    new Date(2024, 0, 1, 0, 0, 0, 0),
    new Date(2025, 0, 1, 0, 0, 0, 0),
  ];
  const testInputExpirationDates = [
    new Date(2024, 11, 31, 23, 59, 59, 999),
    new Date(2025, 11, 31, 23, 59, 59, 999),
  ];
  const mockParsedEffectiveDates = [
    new TZDate(2024, 0, 1, 0, 0, 0, 0),
    new TZDate(2025, 0, 1, 0, 0, 0, 0),
  ];
  const mockParsedExpirationDates = [
    new TZDate(2024, 11, 31, 23, 59, 59, 999),
    new TZDate(2025, 11, 31, 23, 59, 59, 999),
  ];
  const testInput: SetDemonstrationTypesInput = {
    demonstrationId: testDemonstrationId,
    demonstrationTypes: [
      {
        demonstrationTypeName: "Type One",
        demonstrationTypeDates: {
          effectiveDate: testInputEffectiveDates[0],
          expirationDate: testInputExpirationDates[0],
        },
      },
      {
        demonstrationTypeName: "Type Two",
        demonstrationTypeDates: null,
      },
      {
        demonstrationTypeName: "Three Type",
        demonstrationTypeDates: {
          effectiveDate: testInputEffectiveDates[1],
          expirationDate: testInputExpirationDates[1],
        },
      },
    ],
  };
  const mockParsedOutput: ParsedSetDemonstrationTypesInput = {
    demonstrationId: testDemonstrationId,
    demonstrationTypesToDelete: ["Type Two"],
    demonstrationTypesToUpsert: [
      {
        demonstrationTypeName: "Type One",
        demonstrationTypeDates: {
          effectiveDate: mockParsedEffectiveDates[0],
          expirationDate: mockParsedExpirationDates[0],
        },
      },
      {
        demonstrationTypeName: "Three Type",
        demonstrationTypeDates: {
          effectiveDate: mockParsedEffectiveDates[1],
          expirationDate: mockParsedExpirationDates[1],
        },
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(parseSetDemonstrationTypesInput).mockReturnValue(mockParsedOutput as any);
  });

  describe("setDemonstrationTypes", () => {
    it("should do nothing if an empty list of changes is passed", async () => {
      const testInput: SetDemonstrationTypesInput = {
        demonstrationId: testDemonstrationId,
        demonstrationTypes: [],
      };

      await setDemonstrationTypes(undefined, { input: testInput });
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testDemonstrationId, "Demonstration");
      expect(checkForDuplicateDemonstrationTypes).not.toHaveBeenCalled();
      expect(parseSetDemonstrationTypesInput).not.toHaveBeenCalled();
      expect(prisma).not.toHaveBeenCalled();
      expect(createAndUpsertDemonstrationTypeAssignments).not.toHaveBeenCalled();
      expect(deleteDemonstrationTypeAssignments).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should validate, parse, and then operate on the request", async () => {
      await setDemonstrationTypes(undefined, { input: testInput });
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testDemonstrationId, "Demonstration");
      expect(checkForDuplicateDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(testInput);
      expect(parseSetDemonstrationTypesInput).toHaveBeenCalledExactlyOnceWith(testInput);
      expect(prisma).toHaveBeenCalled();
      expect(vi.mocked(prisma).mock.calls.length).toBe(1);
      expect(createAndUpsertDemonstrationTypeAssignments).toHaveBeenCalledExactlyOnceWith(
        mockParsedOutput,
        mockTransaction
      );
      expect(deleteDemonstrationTypeAssignments).toHaveBeenCalledExactlyOnceWith(
        mockParsedOutput,
        mockTransaction
      );
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should handle an error appropriately if it occurs", async () => {
      const testError = new Error("Database connection failed");
      mockPrismaClient.$transaction.mockRejectedValueOnce(testError);

      await expect(setDemonstrationTypes(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(checkForDuplicateDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(testInput);
      expect(parseSetDemonstrationTypesInput).toHaveBeenCalledExactlyOnceWith(testInput);
      expect(createAndUpsertDemonstrationTypeAssignments).not.toHaveBeenCalled();
      expect(deleteDemonstrationTypeAssignments).not.toHaveBeenCalled();
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });
  });
});

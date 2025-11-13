import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExistingDates, mergeApplicationDates } from "./validationPayloadCreationFunctions.js";
import { ApplicationDateInput, ParsedApplicationDateInput } from "../../types.js";

// Mock imports
import { prisma, PrismaTransactionClient } from "../../prismaClient.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("validatePayloadCreationFunctions", () => {
  const transactionMocks = {
    applicationDate: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      findMany: transactionMocks.applicationDate.findMany,
    },
  } as any;
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testOldDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testNewDateValue: Date = new Date("2025-01-07T00:00:00Z");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("getExistingDates", () => {
    it("should request dates for the application from the database", async () => {
      vi.mocked(transactionMocks.applicationDate.findMany).mockReturnValue([
        {
          dateType: "Concept Start Date",
          dateValue: testOldDateValue,
        },
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testOldDateValue,
        },
      ]);
      const expectedCall = {
        select: {
          dateTypeId: true,
          dateValue: true,
        },
        where: {
          applicationId: testApplicationId,
        },
      };

      await getExistingDates(testApplicationId, mockTransaction);
      expect(transactionMocks.applicationDate.findMany).toHaveBeenCalledExactlyOnceWith(
        expectedCall
      );
    });
  });

  describe("mergeApplicationDates", () => {
    it("should merge the two lists correctly", () => {
      const testExistingDates: ParsedApplicationDateInput[] = [
        {
          dateType: "Concept Start Date",
          dateValue: testOldDateValue,
        },
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testOldDateValue,
        },
      ];
      const testNewDates: ParsedApplicationDateInput[] = [
        {
          dateType: "BNPMT Initial Meeting Date",
          dateValue: testOldDateValue,
        },
        {
          dateType: "Concept Start Date",
          dateValue: testNewDateValue,
        },
      ];
      const expectedResult: ApplicationDateInput[] = [
        {
          dateType: "Concept Start Date",
          dateValue: testNewDateValue,
        },
        {
          dateType: "BNPMT Initial Meeting Date",
          dateValue: testOldDateValue,
        },
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: testOldDateValue,
        },
      ];
      const result = mergeApplicationDates(testExistingDates, testNewDates);
      expect(result).toEqual(expect.arrayContaining(expectedResult));
      expect(result).toHaveLength(expectedResult.length);
    });
  });
});

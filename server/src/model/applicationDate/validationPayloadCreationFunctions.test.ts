import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExistingDates, mergeApplicationDates } from "./validationPayloadCreationFunctions.js";
import { ApplicationDateInput } from "../../types.js";

// Mock imports
import { prisma } from "../../prismaClient.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("validatePayloadCreationFunctions", () => {
  const mockFindMany = vi.fn();
  const mockPrismaClient = {
    applicationDate: {
      findMany: mockFindMany,
    },
  };
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testOldDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testNewDateValue: Date = new Date("2025-01-07T00:00:00Z");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("getExistingDates", () => {
    it("should request dates for the application from the database", async () => {
      vi.mocked(mockFindMany).mockReturnValue([
        {
          dateTypeId: "Concept Start Date",
          dateValue: testOldDateValue,
        },
        {
          dateTypeId: "Federal Comment Period Start Date",
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

      await getExistingDates(testApplicationId);
      expect(mockFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("mergeApplicationDates", () => {
    it("should merge the two lists correctly", () => {
      const testExistingDates: ApplicationDateInput[] = [
        {
          dateTypeId: "Concept Start Date",
          dateValue: testOldDateValue,
        },
        {
          dateTypeId: "Federal Comment Period Start Date",
          dateValue: testOldDateValue,
        },
      ];
      const testNewDates: ApplicationDateInput[] = [
        {
          dateTypeId: "BNPMT Initial Meeting Date",
          dateValue: testOldDateValue,
        },
        {
          dateTypeId: "Concept Start Date",
          dateValue: testNewDateValue,
        },
      ];
      const expectedResult: ApplicationDateInput[] = [
        {
          dateTypeId: "Concept Start Date",
          dateValue: testNewDateValue,
        },
        {
          dateTypeId: "BNPMT Initial Meeting Date",
          dateValue: testOldDateValue,
        },
        {
          dateTypeId: "Federal Comment Period Start Date",
          dateValue: testOldDateValue,
        },
      ];
      const result = mergeApplicationDates(testExistingDates, testNewDates);
      expect(result).toEqual(expect.arrayContaining(expectedResult));
      expect(result).toHaveLength(expectedResult.length);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setBundleDate,
  getBundleDatesForPhase,
  getTargetDateValue,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
  validateInputDate,
} from "./bundleDateResolvers.js";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { SetBundleDateInput, DateType, PhaseName } from "../../types.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(),
}));

vi.mock("../bundle/bundleResolvers.js", () => ({
  getBundle: vi.fn(),
}));

describe("bundleDateResolvers", () => {
  const mockUpsert = vi.fn();
  const mockFindMany = vi.fn();
  const mockFindUnique = vi.fn();
  const mockPrismaClient = {
    bundleDate: {
      upsert: mockUpsert,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
    },
  };
  const testDateType: DateType = "Concept Start Date";
  const testDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testBundleId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(mockFindMany).mockReturnValue([
      {
        dateTypeId: testDateType,
        dateValue: testDateValue,
        createdAt: testDateValue,
        updatedAt: testDateValue,
      },
    ]);
    vi.mocked(mockFindUnique).mockReturnValue({ dateValue: testDateValue });
  });

  describe("getTargetDateValue", () => {
    it("should request the target date value from the database", async () => {
      vi.mocked(mockFindUnique).mockReturnValue({ dateValue: testDateValue });
      const expectedCall = {
        select: {
          dateValue: true,
        },
        where: {
          bundleId_dateTypeId: {
            bundleId: testBundleId,
            dateTypeId: testDateType,
          },
        },
      };
      await getTargetDateValue(testBundleId, testDateType);
      expect(mockFindUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });

    it("should throw an error if the date is not returned", async () => {
      vi.mocked(mockFindUnique).mockReturnValue(null);
      await expect(getTargetDateValue(testBundleId, testDateType)).rejects.toThrow();
    });
  });

  describe("checkInputDateGreaterThan", async () => {
    it("should not throw when the date is greater than the target", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: new Date("2025-11-01T00:00:00.000Z"),
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
      };
      await expect(checkInputDateGreaterThan(testInputDate, testTargetDate)).resolves.not.toThrow();
    });

    it("should throw when the date is less than the target", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: new Date("2024-11-01T00:00:00.000Z"),
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
      };
      await expect(checkInputDateGreaterThan(testInputDate, testTargetDate)).rejects.toThrow();
    });

    it("should throw when the date is equal to the target", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: testDateValue,
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
      };
      await expect(checkInputDateGreaterThan(testInputDate, testTargetDate)).rejects.toThrow();
    });
  });

  describe("checkInputDateGreaterThanOrEqual", () => {
    it("should not throw when the date is greater than the target", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: new Date("2025-11-01T00:00:00.000Z"),
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
      };
      await expect(
        checkInputDateGreaterThanOrEqual(testInputDate, testTargetDate)
      ).resolves.not.toThrow();
    });

    it("should throw when the date is less than the target", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: new Date("2024-11-01T00:00:00.000Z"),
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
      };
      await expect(
        checkInputDateGreaterThanOrEqual(testInputDate, testTargetDate)
      ).rejects.toThrow();
    });

    it("should not throw when the date is equal to the target", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: testDateValue,
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
      };
      await expect(
        checkInputDateGreaterThanOrEqual(testInputDate, testTargetDate)
      ).resolves.not.toThrow();
    });
  });

  describe("checkInputDateMeetsOffset", () => {
    it("should not throw when the input matches the target plus the offset", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: new Date("2025-01-15T00:00:00.000Z"),
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
        offsetDays: 14,
      };
      await expect(checkInputDateMeetsOffset(testInputDate, testTargetDate)).resolves.not.toThrow();
    });

    it("should throw when the input does not match the target plus the offset", async () => {
      const testInputDate = {
        dateType: testDateType,
        dateValue: new Date("2025-01-16T00:00:00.000Z"),
      };
      const testTargetDate = {
        bundleId: testBundleId,
        dateType: testDateType,
        offsetDays: 14,
      };
      await expect(checkInputDateMeetsOffset(testInputDate, testTargetDate)).rejects.toThrow();
    });
  });

  describe("setBundleDate", () => {
    const testBundleId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
    const testData: SetBundleDateInput = {
      bundleId: testBundleId,
      dateType: testDateType,
      dateValue: testDateValue,
    };
    const testError = new Error("Database connection failed");

    it("should upsert bundle date and return the updated bundle", async () => {
      const expectedCall = {
        where: {
          bundleId_dateTypeId: {
            bundleId: testBundleId,
            dateTypeId: testDateType,
          },
        },
        update: {
          dateValue: testDateValue,
        },
        create: {
          bundleId: testBundleId,
          dateTypeId: testDateType,
          dateValue: testDateValue,
        },
      };
      await setBundleDate(undefined, { input: testData });
      expect(mockUpsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(getBundle).toHaveBeenCalledExactlyOnceWith(testBundleId);
    });

    it("should handle an error appropriately if it occurs", async () => {
      mockUpsert.mockRejectedValueOnce(testError);
      await setBundleDate(undefined, { input: testData });
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });
  });
  describe("getBundleDatesForPhase", () => {
    const testBundleId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
    const testPhaseId: PhaseName = "Concept";
    it("should retrieve the requested dates for the phase and bundle", async () => {
      const expectedCall = {
        select: {
          dateTypeId: true,
          dateValue: true,
          createdAt: true,
          updatedAt: true,
        },
        where: {
          bundleId: testBundleId,
          dateType: {
            phaseDateTypes: {
              some: { phaseId: testPhaseId },
            },
          },
        },
      };

      await getBundleDatesForPhase(testBundleId, testPhaseId);
      expect(mockFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});

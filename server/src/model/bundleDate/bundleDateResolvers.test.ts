import { describe, it, expect, vi, beforeEach } from "vitest";
import { setBundleDate, getBundleDatesForPhase } from "./bundleDateResolvers.js";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { SetBundleDateInput, DateType, PhaseName } from "../../types.js";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(),
}));

vi.mock("../bundle/bundleResolvers", () => ({
  getBundle: vi.fn(),
}));

describe("bundleDateResolvers", () => {
  const mockUpsert = vi.fn();
  const mockFindMany = vi.fn();
  const mockPrismaClient = {
    bundleDate: {
      upsert: mockUpsert,
      findMany: mockFindMany,
    },
  };
  const testDateType: DateType = "Concept Start Date";
  const testDateValue: Date = new Date("2025-01-01T00:00:00-04:00");

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

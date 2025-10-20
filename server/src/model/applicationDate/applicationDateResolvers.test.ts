import { describe, it, expect, vi, beforeEach } from "vitest";
import { setApplicationDate, getApplicationDatesForPhase } from "./applicationDateResolvers.js";
import { SetApplicationDateInput, DateType, PhaseName } from "../../types.js";
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getApplication } from "../application/applicationResolvers.js";
import { validateInputDate } from "./validateInputDate.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application/applicationResolvers.js", () => ({
  getApplication: vi.fn(),
}));

vi.mock("./validateInputDate.js", () => ({
  validateInputDate: vi.fn(),
}));

describe("applicationDateResolvers", () => {
  const mockUpsert = vi.fn();
  const mockFindMany = vi.fn();
  const mockPrismaClient = {
    applicationDate: {
      upsert: mockUpsert,
      findMany: mockFindMany,
    },
  };
  const testDateType: DateType = "Concept Start Date";
  const testDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

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

  describe("setApplicationDate", () => {
    const testData: SetApplicationDateInput = {
      applicationId: testApplicationId,
      dateType: testDateType,
      dateValue: testDateValue,
    };
    const testError = new Error("Database connection failed");

    it("should upsert application date and return the updated application", async () => {
      const expectedCall = {
        where: {
          applicationId_dateTypeId: {
            applicationId: testApplicationId,
            dateTypeId: testDateType,
          },
        },
        update: {
          dateValue: testDateValue,
        },
        create: {
          applicationId: testApplicationId,
          dateTypeId: testDateType,
          dateValue: testDateValue,
        },
      };
      await setApplicationDate(undefined, { input: testData });
      expect(validateInputDate).toHaveBeenCalledExactlyOnceWith(testData);
      expect(mockUpsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should handle an error appropriately if it occurs", async () => {
      mockUpsert.mockRejectedValueOnce(testError);
      await expect(setApplicationDate(undefined, { input: testData })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(validateInputDate).toHaveBeenCalledExactlyOnceWith(testData);
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });
  });
  describe("getApplicationDatesForPhase", () => {
    const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
    const testPhaseId: PhaseName = "Concept";
    it("should retrieve the requested dates for the phase and application", async () => {
      const expectedCall = {
        select: {
          dateTypeId: true,
          dateValue: true,
          createdAt: true,
          updatedAt: true,
        },
        where: {
          applicationId: testApplicationId,
          dateType: {
            phaseDateTypes: {
              some: { phaseId: testPhaseId },
            },
          },
        },
      };

      await getApplicationDatesForPhase(testApplicationId, testPhaseId);
      expect(mockFindMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { __setApplicationDate, __resolveApplicationDateType } from "./applicationDateResolvers.js";
import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { SetApplicationDateInput, DateType } from "../../types.js";
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
  const mockPrismaClient = {
    applicationDate: {
      upsert: mockUpsert,
    },
  };
  const testDateType: DateType = "Concept Start Date";
  const testDateValue: Date = new Date("2025-01-01T00:00:00Z");
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("__setApplicationDate", () => {
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
      await __setApplicationDate(undefined, { input: testData });
      expect(validateInputDate).toHaveBeenCalledExactlyOnceWith(testData);
      expect(mockUpsert).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should handle an error appropriately if it occurs", async () => {
      mockUpsert.mockRejectedValueOnce(testError);
      await expect(__setApplicationDate(undefined, { input: testData })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(validateInputDate).toHaveBeenCalledExactlyOnceWith(testData);
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });
  });

  describe("__resolveApplicationDateType", () => {
    it("should retrieve the requested date type", () => {
      const testPrismaResult: PrismaApplicationDate = {
        applicationId: testApplicationId,
        dateTypeId: testDateType,
        dateValue: testDateValue,
        createdAt: testDateValue,
        updatedAt: testDateValue,
      };
      const result = __resolveApplicationDateType(testPrismaResult);
      expect(result).toBe(testDateType);
    });
  });
});

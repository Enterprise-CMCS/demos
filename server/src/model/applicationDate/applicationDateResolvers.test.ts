import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  __setApplicationDates,
  __resolveApplicationDateType,
  __setApplicationDate,
} from "./applicationDateResolvers.js";
import { SetApplicationDateInput, SetApplicationDatesInput } from "../../types.js";
import { ParsedSetApplicationDatesInput } from ".";
import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getApplication } from "../application/applicationResolvers.js";
import { validateAndUpdateDates } from "./validateAndUpdateDates.js";
import { startPhaseOnDateUpdate } from "./startPhaseOnDateUpdate.js";

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

vi.mock("./validateAndUpdateDates.js", () => ({
  validateAndUpdateDates: vi.fn(),
}));

vi.mock("./startPhaseOnDateUpdate.js", () => ({
  startPhaseOnDateUpdate: vi.fn(),
}));

describe("applicationDateResolvers", () => {
  const mockTransaction: any = "Test";
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testDateValue = new Date("2025-01-01T00:00:00.000Z");
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(startPhaseOnDateUpdate).mockResolvedValue([]);
  });

  describe("__setApplicationDates", () => {
    const testInput: SetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateType: "Concept Start Date",
          dateValue: testDateValue,
        },
        {
          dateType: "Federal Comment Period End Date",
          dateValue: testDateValue,
        },
      ],
    };

    it("should do nothing if an empty list of dates is passed", async () => {
      const testInput: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [],
      };
      await __setApplicationDates(undefined, { input: testInput });
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      expect(prisma).not.toHaveBeenCalled();
      expect(startPhaseOnDateUpdate).not.toHaveBeenCalled();
    });

    it("should call startPhaseOnDateUpdate before validateAndUpdateDates", async () => {
      await __setApplicationDates(undefined, { input: testInput });
      expect(startPhaseOnDateUpdate).toHaveBeenCalledExactlyOnceWith(testInput, mockTransaction);
      expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(testInput, mockTransaction);
      expect(startPhaseOnDateUpdate).toHaveBeenCalledBefore(validateAndUpdateDates as any);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should append phase start dates to input before validation", async () => {
      const phaseStartDates = [
        {
          dateType: "Application Intake Start Date",
          dateValue: testDateValue,
        },
      ];
      vi.mocked(startPhaseOnDateUpdate).mockResolvedValue(phaseStartDates as any);

      const inputCopy = { ...testInput, applicationDates: [...testInput.applicationDates] };
      await __setApplicationDates(undefined, { input: inputCopy });

      expect(startPhaseOnDateUpdate).toHaveBeenCalledWith(inputCopy, mockTransaction);
      expect(validateAndUpdateDates).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: testApplicationId,
          applicationDates: expect.arrayContaining([
            ...testInput.applicationDates,
            ...phaseStartDates,
          ]),
        }),
        mockTransaction
      );
    });

    it("should validate and update based on the input if it is present", async () => {
      await __setApplicationDates(undefined, { input: testInput });
      expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(testInput, mockTransaction);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should handle an error appropriately if it occurs", async () => {
      mockPrismaClient.$transaction.mockRejectedValueOnce(testError);
      await expect(__setApplicationDates(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });

    it("should handle an error from startPhaseOnDateUpdate appropriately", async () => {
      vi.mocked(startPhaseOnDateUpdate).mockRejectedValueOnce(testError);
      await expect(__setApplicationDates(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
    });
  });

  describe("__setApplicationDate", () => {
    const testInput: SetApplicationDateInput = {
      applicationId: testApplicationId,
      dateType: "BNPMT Initial Meeting Date",
      dateValue: testDateValue,
    };
    const transformedTestInput: SetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateType: "BNPMT Initial Meeting Date",
          dateValue: testDateValue,
        },
      ],
    };

    describe("invokes __setApplicationDates with a single item", () => {
      it("should validate and update based on the input if it is present", async () => {
        await __setApplicationDate(undefined, { input: testInput });
        expect(startPhaseOnDateUpdate).toHaveBeenCalledExactlyOnceWith(
          transformedTestInput,
          mockTransaction
        );
        expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(
          transformedTestInput,
          mockTransaction
        );
        expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      });
    });

    it("should merge phase start dates with input dates, prioritizing input dates when types conflict", async () => {
      const phaseStartDates = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-01T00:00:00.000Z"),
        },
        {
          dateType: "Concept Start Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"), // This will be overwritten
        },
      ];
      vi.mocked(startPhaseOnDateUpdate).mockResolvedValue(phaseStartDates as any);

      const inputWithConflict: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "Concept Start Date",
            dateValue: new Date("2025-02-01T00:00:00.000Z"), // This should win
          },
          {
            dateType: "Federal Comment Period End Date",
            dateValue: new Date("2025-03-01T00:00:00.000Z"),
          },
        ],
      };

      await __setApplicationDates(undefined, { input: inputWithConflict });

      expect(validateAndUpdateDates).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: testApplicationId,
          applicationDates: expect.arrayContaining([
            {
              dateType: "Application Intake Start Date",
              dateValue: new Date("2025-01-01T00:00:00.000Z"),
            },
            {
              dateType: "Concept Start Date",
              dateValue: new Date("2025-02-01T00:00:00.000Z"), // Input date wins
            },
            {
              dateType: "Federal Comment Period End Date",
              dateValue: new Date("2025-03-01T00:00:00.000Z"),
            },
          ]),
        }),
        mockTransaction
      );

      // Verify the merged array has exactly 3 items (no duplicates)
      const calledWith = vi.mocked(validateAndUpdateDates).mock.calls[0][0];
      expect(calledWith.applicationDates).toHaveLength(3);

      // Verify "Concept Start Date" appears only once with the input value
      const conceptDates = calledWith.applicationDates.filter(
        (date) => date.dateType === "Concept Start Date"
      );
      expect(conceptDates).toHaveLength(1);
      expect(conceptDates[0].dateValue).toEqual(new Date("2025-02-01T00:00:00.000Z"));
    });
  });

  describe("__resolveApplicationDateType", () => {
    it("should retrieve the requested date type", () => {
      const testPrismaResult: PrismaApplicationDate = {
        applicationId: testApplicationId,
        dateTypeId: "Concept Start Date",
        dateValue: testDateValue,
        createdAt: testDateValue,
        updatedAt: testDateValue,
      };
      const result = __resolveApplicationDateType(testPrismaResult);
      expect(result).toBe("Concept Start Date");
    });
  });
});

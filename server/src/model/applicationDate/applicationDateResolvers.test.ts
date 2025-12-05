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
import { startPhasesByDates } from "./startPhasesByDate.js";
import { getEasternNow } from "../../dateUtilities.js";

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

vi.mock("./startPhasesByDate.js", () => ({
  startPhasesByDates: vi.fn(),
}));

vi.mock("../../dateUtilities.js", () => ({
  getEasternNow: vi.fn(),
}));

describe("applicationDateResolvers", () => {
  const mockTransaction: any = "Test";
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testDateValue = new Date("2025-01-01T00:00:00.000Z");
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");

  const mockEasternNow = {
    "Start of Day": {
      easternTZDate: new Date("2025-01-01T05:00:00.000Z"),
      easternTZString: "2025-01-01T00:00:00-05:00",
    },
    "End of Day": {
      easternTZDate: new Date("2025-01-02T04:59:59.999Z"),
      easternTZString: "2025-01-01T23:59:59.999-05:00",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(getEasternNow).mockReturnValue(mockEasternNow as any);
    vi.mocked(startPhasesByDates).mockResolvedValue([]);
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

    it("should call startPhasesByDates with correct arguments", async () => {
      await __setApplicationDates(undefined, { input: testInput });

      expect(getEasternNow).toHaveBeenCalledExactlyOnceWith();
      expect(startPhasesByDates).toHaveBeenCalledExactlyOnceWith(
        mockTransaction,
        testApplicationId,
        testInput.applicationDates,
        mockEasternNow
      );
    });

    it("should merge phase start dates with input dates before validation", async () => {
      const phaseStartDates = [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date("2025-01-15T00:00:00.000Z"),
        },
      ];
      vi.mocked(startPhasesByDates).mockResolvedValueOnce(phaseStartDates as any);

      await __setApplicationDates(undefined, { input: testInput });

      expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(
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
        expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(
          transformedTestInput,
          mockTransaction
        );
        expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      });
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

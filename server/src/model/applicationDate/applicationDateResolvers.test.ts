import { describe, it, expect, vi, beforeEach } from "vitest";
import { __setApplicationDates, __resolveApplicationDateType } from "./applicationDateResolvers.js";
import { SetApplicationDatesInput } from "../../types.js";
import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getApplication } from "../application/applicationResolvers.js";
import { validateInputDates } from "./validateInputDates.js";
import { getExistingDates, mergeApplicationDates } from "./validationPayloadCreationFunctions.js";

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

vi.mock("./validateInputDates.js", () => ({
  validateInputDates: vi.fn(),
}));

vi.mock("./validationPayloadCreationFunctions.js", () => ({
  getExistingDates: vi.fn(),
  mergeApplicationDates: vi.fn(),
}));

describe("applicationDateResolvers", () => {
  const regularMocks = {
    applicationDate: {
      upsert: vi.fn(),
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn(),
    applicationDate: {
      upsert: regularMocks.applicationDate.upsert,
    },
  };

  const testDateValue = new Date("2025-01-01T00:00:00Z");
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  describe("__setApplicationDates", () => {
    const testInput: SetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateTypeId: "Concept Start Date",
          dateValue: testDateValue,
        },
        {
          dateTypeId: "Federal Comment Period End Date",
          dateValue: testDateValue,
        },
      ],
    };
    const testError = new Error("Database connection failed");

    it("should do nothing if an empty list of dates is passed", async () => {
      const testInput: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [],
      };
      await __setApplicationDates(undefined, { input: testInput });
      expect(getExistingDates).not.toHaveBeenCalled();
      expect(mergeApplicationDates).not.toHaveBeenCalled();
      expect(validateInputDates).not.toHaveBeenCalled();
      expect(prisma).not.toHaveBeenCalled();
      expect(regularMocks.applicationDate.upsert).not.toHaveBeenCalled();
      expect(mockPrismaClient.$transaction).not.toHaveBeenCalled();
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should validate the input list if it is passed", async () => {
      vi.mocked(getExistingDates).mockResolvedValueOnce([]);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testInput.applicationDates);

      await __setApplicationDates(undefined, { input: testInput });
      expect(getExistingDates).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      expect(mergeApplicationDates).toHaveBeenCalledExactlyOnceWith([], testInput.applicationDates);
      expect(validateInputDates).toHaveBeenCalledExactlyOnceWith(testInput.applicationDates);
    });

    it("should perform upserts in a transaction", async () => {
      vi.mocked(getExistingDates).mockResolvedValueOnce([]);
      regularMocks.applicationDate.upsert
        .mockReturnValueOnce("mock-response-1")
        .mockReturnValueOnce("mock-response-2");
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testInput.applicationDates);
      const expectedCalls = [
        [
          {
            where: {
              applicationId_dateTypeId: {
                applicationId: testApplicationId,
                dateTypeId: "Concept Start Date",
              },
            },
            update: {
              dateValue: testDateValue,
            },
            create: {
              applicationId: testApplicationId,
              dateTypeId: "Concept Start Date",
              dateValue: testDateValue,
            },
          },
        ],
        [
          {
            where: {
              applicationId_dateTypeId: {
                applicationId: testApplicationId,
                dateTypeId: "Federal Comment Period End Date",
              },
            },
            update: {
              dateValue: testDateValue,
            },
            create: {
              applicationId: testApplicationId,
              dateTypeId: "Federal Comment Period End Date",
              dateValue: testDateValue,
            },
          },
        ],
      ];

      await __setApplicationDates(undefined, { input: testInput });
      expect(regularMocks.applicationDate.upsert.mock.calls).toEqual(expectedCalls);
      expect(mockPrismaClient.$transaction).toHaveBeenCalledExactlyOnceWith([
        "mock-response-1",
        "mock-response-2",
      ]);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should handle an error appropriately if it occurs", async () => {
      vi.mocked(getExistingDates).mockResolvedValueOnce([]);
      vi.mocked(mergeApplicationDates).mockReturnValueOnce(testInput.applicationDates);

      mockPrismaClient.$transaction.mockRejectedValueOnce(testError);
      await expect(__setApplicationDates(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(validateInputDates).toHaveBeenCalledExactlyOnceWith(testInput.applicationDates);
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
      expect(getApplication).not.toHaveBeenCalled();
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

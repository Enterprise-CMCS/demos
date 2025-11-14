import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  __setApplicationDates,
  __resolveApplicationDateType,
  __setApplicationDate,
  __parseInputApplicationDates,
} from "./applicationDateResolvers.js";
import {
  ParsedSetApplicationDatesInput,
  SetApplicationDateInput,
  SetApplicationDatesInput,
} from "../../types.js";
import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { parseDateTimeOrLocalDateToJSDate } from "../../dateUtilities.js";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getApplication } from "../application/applicationResolvers.js";
import { validateInputDates } from "./validateInputDates.js";
import {
  getExistingDates,
  mergeApplicationDates,
} from "./dateValidationPayloadCreationFunctions.js";

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

vi.mock("./dateValidationPayloadCreationFunctions.js", () => ({
  getExistingDates: vi.fn(),
  mergeApplicationDates: vi.fn(),
}));

describe("applicationDateResolvers", () => {
  const regularMocks = {
    applicationDate: {
      upsert: vi.fn(),
    },
  };
  const transactionMocks = {
    applicationDate: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      upsert: transactionMocks.applicationDate.upsert,
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    applicationDate: {
      upsert: regularMocks.applicationDate.upsert,
    },
  };

  const testDateValue = new Date("2025-01-01T00:00:00Z");
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("__parseInputApplicationDates", () => {
    it("should return nicely parsed Dates from LocalDate inputs", () => {
      const testLocalDateValue = "2025-01-15";
      const testInput: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "Federal Comment Period Start Date",
            dateValue: testLocalDateValue,
          },
          {
            dateType: "Federal Comment Period End Date",
            dateValue: testLocalDateValue,
          },
        ],
      };
      const expectedOutput: SetApplicationDatesInput = {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "Federal Comment Period Start Date",
            dateValue: parseDateTimeOrLocalDateToJSDate(testLocalDateValue, "Start of Day"),
          },
          {
            dateType: "Federal Comment Period End Date",
            dateValue: parseDateTimeOrLocalDateToJSDate(testLocalDateValue, "End of Day"),
          },
        ],
      };

      const result = __parseInputApplicationDates(testInput);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe("__setApplicationDates", () => {
    const testInput: ParsedSetApplicationDatesInput = {
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
      expect(getExistingDates).toHaveBeenCalledExactlyOnceWith(testApplicationId, mockTransaction);
      expect(mergeApplicationDates).toHaveBeenCalledExactlyOnceWith([], testInput.applicationDates);
      expect(validateInputDates).toHaveBeenCalledExactlyOnceWith(testInput.applicationDates);
    });

    it("should perform upserts in a transaction", async () => {
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
      expect(transactionMocks.applicationDate.upsert.mock.calls).toEqual(expectedCalls);
      expect(mockPrismaClient.$transaction).toHaveBeenCalledExactlyOnceWith(expect.any(Function));
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
    });

    it("should handle an error appropriately if it occurs", async () => {
      mockPrismaClient.$transaction.mockRejectedValueOnce(testError);
      await expect(__setApplicationDates(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(getExistingDates).not.toHaveBeenCalled();
      expect(mergeApplicationDates).not.toHaveBeenCalled();
      expect(validateInputDates).not.toHaveBeenCalled();
      expect(transactionMocks.applicationDate.upsert).not.toHaveBeenCalled();
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
    const transformedTestInput: ParsedSetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateType: "BNPMT Initial Meeting Date",
          dateValue: testDateValue,
        },
      ],
    };

    describe("invokes __setApplicationDates with a single item", () => {
      it("should validate the input list", async () => {
        vi.mocked(getExistingDates).mockResolvedValueOnce([]);
        vi.mocked(mergeApplicationDates).mockReturnValueOnce(transformedTestInput.applicationDates);

        await __setApplicationDate(undefined, { input: testInput });
        expect(getExistingDates).toHaveBeenCalledExactlyOnceWith(
          testApplicationId,
          mockTransaction
        );
        expect(mergeApplicationDates).toHaveBeenCalledExactlyOnceWith(
          [],
          transformedTestInput.applicationDates
        );
        expect(validateInputDates).toHaveBeenCalledExactlyOnceWith(
          transformedTestInput.applicationDates
        );
      });

      it("should perform upserts in a transaction", async () => {
        const expectedCalls = [
          [
            {
              where: {
                applicationId_dateTypeId: {
                  applicationId: testApplicationId,
                  dateTypeId: "BNPMT Initial Meeting Date",
                },
              },
              update: {
                dateValue: testDateValue,
              },
              create: {
                applicationId: testApplicationId,
                dateTypeId: "BNPMT Initial Meeting Date",
                dateValue: testDateValue,
              },
            },
          ],
        ];

        await __setApplicationDate(undefined, { input: testInput });
        expect(transactionMocks.applicationDate.upsert.mock.calls).toEqual(expectedCalls);
        expect(mockPrismaClient.$transaction).toHaveBeenCalledExactlyOnceWith(expect.any(Function));
        expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId);
      });

      it("should handle an error appropriately if it occurs", async () => {
        mockPrismaClient.$transaction.mockRejectedValueOnce(testError);
        await expect(__setApplicationDate(undefined, { input: testInput })).rejects.toThrowError(
          testHandlePrismaError
        );
        expect(getExistingDates).not.toHaveBeenCalled();
        expect(mergeApplicationDates).not.toHaveBeenCalled();
        expect(validateInputDates).not.toHaveBeenCalled();
        expect(transactionMocks.applicationDate.upsert).not.toHaveBeenCalled();
        expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
        expect(getApplication).not.toHaveBeenCalled();
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

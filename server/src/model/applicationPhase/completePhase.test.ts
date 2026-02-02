import { describe, it, expect, vi, beforeEach } from "vitest";
import { completePhase } from "./completePhase.js";
import { CompletePhaseInput } from "../../types.js";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { validateAndUpdateDates } from "../applicationDate";
import { validatePhaseCompletion, updatePhaseStatus, setPhaseToStarted } from ".";
import { EasternTZDate, getEasternNow } from "../../dateUtilities.js";
import { TZDate } from "@date-fns/tz";
import {
  getApplication,
  updateApplicationStatusToUnderReviewIfNeeded,
  updateApplicationStatus,
} from "../application";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
  updateApplicationStatusToUnderReviewIfNeeded: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  validateAndUpdateDates: vi.fn(),
}));

// The importActual line is necessary to avoid overwriting the constant
vi.mock(".", async () => {
  const actual = await vi.importActual(".");
  return {
    ...actual,
    validatePhaseCompletion: vi.fn(),
    updatePhaseStatus: vi.fn(),
    setPhaseToStarted: vi.fn(),
    updateApplicationStatusToUnderReviewIfNeeded: vi.fn(),
    updateApplicationStatus: vi.fn(),
  };
});

vi.mock("../../dateUtilities.js", () => ({
  getEasternNow: vi.fn(),
}));

describe("completePhase", () => {
  const mockTransaction: any = vi.fn();
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");
  const mockEasternStartOfDayDate = new Date("2025-01-13T00:00:00.000-05:00");
  const mockEasternEndOfDayDate = new Date("2025-01-13T23:59:59.999-05:00");
  const mockEasternValue = {
    "Start of Day": {
      isEasternTZDate: true,
      easternTZDate: new TZDate(mockEasternStartOfDayDate, "America/New_York"),
    } satisfies EasternTZDate,
    "End of Day": {
      isEasternTZDate: true,
      easternTZDate: new TZDate(mockEasternEndOfDayDate, "America/New_York"),
    } satisfies EasternTZDate,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(getEasternNow).mockReturnValue(mockEasternValue);
    vi.mocked(setPhaseToStarted).mockResolvedValue(true);
  });

  describe("Concept Phase", () => {
    it("should take the right actions when completing the Concept phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Concept",
      };
      const validateCompleteDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Concept Completion Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Application Intake Start Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Concept",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Concept",
        "Completed",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual([
        validateCompleteDateCall,
        validateStartDateCall,
      ]);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        mockTransaction
      );
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });

    it("should not set application status to review if the next phase was not started", async () => {
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Concept",
      };
      const validateCompleteDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Concept Completion Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      await completePhase(undefined, { input: testInput });

      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
    });
  });

  describe("Application Intake Phase", () => {
    it("should take the right actions when completing the Application Intake phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Application Intake",
      };
      const validateCompleteDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Application Intake Completion Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Completeness Start Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        "Completed",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Completeness",
        mockTransaction
      );
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual([
        validateCompleteDateCall,
        validateStartDateCall,
      ]);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });
  });

  describe("Completeness Phase", () => {
    it("should take the right actions when completing the Completeness phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Completeness",
      };
      const validateCompleteDateCall = [
        [
          {
            applicationId: testApplicationId,
            applicationDates: [
              {
                dateType: "Completeness Completion Date",
                dateValue: mockEasternStartOfDayDate,
              },
            ],
          },
          mockTransaction,
        ],
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Completeness",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Completeness",
        "Completed",
        mockTransaction
      );
      expect(setPhaseToStarted).not.toBeCalled();
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual(validateCompleteDateCall);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });
  });

  describe("Federal Comment Phase", () => {
    it("should throw when attempting to complete the Federal Comment phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Federal Comment",
      };

      await expect(completePhase(undefined, { input: testInput })).rejects.toThrowError(
        "Operations against the Federal Comment phase are not permitted via API."
      );

      expect(validatePhaseCompletion).not.toHaveBeenCalled();
      expect(updatePhaseStatus).not.toHaveBeenCalled();
      expect(setPhaseToStarted).not.toBeCalled();
      expect(validateAndUpdateDates).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });
  });

  describe("SDG Preparation Phase", () => {
    it("should take the right actions when completing the SDG Preparation phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "SDG Preparation",
      };
      const validateCompleteDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "SDG Preparation Completion Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Review Start Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "SDG Preparation",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "SDG Preparation",
        "Completed",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual([
        validateCompleteDateCall,
        validateStartDateCall,
      ]);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });
  });

  describe("Review Phase", () => {
    it("should take the right actions when completing the Review phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Review",
      };
      const validateCompleteDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Review Completion Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Approval Package Start Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        "Completed",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Package",
        mockTransaction
      );
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual([
        validateCompleteDateCall,
        validateStartDateCall,
      ]);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });
  });

  describe("Approval Package Phase", () => {
    it("should take the right actions when completing the Approval Package phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Approval Package",
      };
      const validateCompleteDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Approval Package Completion Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Approval Summary Start Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Package",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Package",
        "Completed",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Summary",
        mockTransaction
      );
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual([
        validateCompleteDateCall,
        validateStartDateCall,
      ]);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });
  });

  describe("Approval Summary Phase", () => {
    it("should take the right actions when completing the Approval Summary phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Approval Summary",
      };
      const validateCompleteDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Approval Summary Completion Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Summary",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Summary",
        "Completed",
        mockTransaction
      );
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual([validateCompleteDateCall]);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approved",
        mockTransaction
      );
    });
  });

  describe("Special Cases", () => {
    it("should handle an error in the transaction appropriately if it occurs", async () => {
      vi.mocked(validatePhaseCompletion).mockRejectedValueOnce(testError);
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Concept",
      };

      await expect(completePhase(undefined, { input: testInput })).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });

    it("should skip changing the date if the next phase is already started", async () => {
      vi.mocked(setPhaseToStarted).mockResolvedValue(false);
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Concept",
      };
      const expectedDateCall = [
        [
          {
            applicationId: testApplicationId,
            applicationDates: [
              {
                dateType: "Concept Completion Date",
                dateValue: mockEasternStartOfDayDate,
              },
            ],
          },
          mockTransaction,
        ],
      ];

      await completePhase(undefined, { input: testInput });

      expect(validatePhaseCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Concept",
        mockTransaction
      );
      expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Concept",
        "Completed",
        mockTransaction
      );
      expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        mockTransaction
      );
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual(expectedDateCall);
      expect(handlePrismaError).not.toHaveBeenCalled();
      expect(updateApplicationStatusToUnderReviewIfNeeded).not.toHaveBeenCalled();
      expect(updateApplicationStatus).not.toHaveBeenCalled();
    });
  });
});

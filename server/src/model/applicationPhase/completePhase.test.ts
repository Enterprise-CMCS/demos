import { describe, it, expect, vi, beforeEach } from "vitest";
import { completePhase } from "./completePhase";
import type { CompletePhaseInput } from "../../types";
import { __DEMOS_VERSION__ } from "../../flags";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
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
  };
});

vi.mock("../../dateUtilities", () => ({
  formatDateToPlainDate: vi.fn(),
}));

vi.mock("../email/notifyApplicationEvent", () => ({
  notifyApplicationStatusUpdated: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { getApplication } from "../application";
import { validateAndUpdateDates } from "../applicationDate";
import { validatePhaseCompletion, updatePhaseStatus, setPhaseToStarted } from ".";
import { formatDateToPlainDate } from "../../dateUtilities";

describe("completePhase", () => {
  const mockTransaction: any = vi.fn();
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");
  const mockEasternToday = "2025-01-13";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getApplication).mockResolvedValue({
      id: testApplicationId,
      statusId: "Under Review",
    } as Awaited<ReturnType<typeof getApplication>>);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(formatDateToPlainDate).mockReturnValue(mockEasternToday);
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
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Application Intake Start Date",
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Completeness Start Date",
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
                plainDate: mockEasternToday,
              },
            ],
          },
          mockTransaction,
          __DEMOS_VERSION__,
        ],
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
      expect(setPhaseToStarted).not.toHaveBeenCalled();
      expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual(validateCompleteDateCall);
      expect(handlePrismaError).not.toHaveBeenCalled();
    });
  });

  describe("Federal Comment Phase", () => {
    it("should throw when attempting to complete the Federal Comment phase", async () => {
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Federal Comment",
      };

      await expect(
        completePhase(undefined, { input: testInput }, { user: { id: "user-1" } })
      ).rejects.toThrow("Operations against the Federal Comment phase are not permitted via API.");

      expect(validatePhaseCompletion).not.toHaveBeenCalled();
      expect(updatePhaseStatus).not.toHaveBeenCalled();
      expect(setPhaseToStarted).not.toHaveBeenCalled();
      expect(validateAndUpdateDates).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
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
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Review Start Date",
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Approval Package Start Date",
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      const validateStartDateCall = [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Approval Summary Start Date",
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
    });
  });

  describe("Special Cases", () => {
    it("should handle an error in the transaction appropriately if it occurs", async () => {
      vi.mocked(validatePhaseCompletion).mockRejectedValueOnce(testError);
      const testInput: CompletePhaseInput = {
        applicationId: testApplicationId,
        phaseName: "Concept",
      };

      await expect(
        completePhase(undefined, { input: testInput }, { user: { id: "user-1" } })
      ).rejects.toThrow(testHandlePrismaError);
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
                plainDate: mockEasternToday,
              },
            ],
          },
          mockTransaction,
          __DEMOS_VERSION__,
        ],
      ];

      await completePhase(undefined, { input: testInput }, { user: { id: "user-1" } });

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
    });
  });
});

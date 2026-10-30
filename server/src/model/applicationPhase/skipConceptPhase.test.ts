import { getApplication } from "../application";
vi.mock("../email/notifyApplicationEvent", () => ({
  notifyApplicationStatusUpdated: vi.fn(),
}));
import { describe, it, expect, vi, beforeEach } from "vitest";
import { skipConceptPhase } from "./skipConceptPhase.js";
import { __DEMOS_VERSION__ } from "../../flags";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { validateAndUpdateDates } from "../applicationDate";
import {
  checkConceptPhaseStartedBeforeSkipping,
  getApplicationPhaseStatus,
  setPhaseToStarted,
  updatePhaseStatus,
} from ".";
import { formatDateToPlainDate } from "../../dateUtilities.js";

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
}));

vi.mock("../applicationDate", () => ({
  validateAndUpdateDates: vi.fn(),
}));

// The importActual line is necessary to avoid overwriting the constant
vi.mock(".", async () => {
  const actual = await vi.importActual(".");
  return {
    ...actual,
    checkConceptPhaseStartedBeforeSkipping: vi.fn(),
    getApplicationPhaseStatus: vi.fn(),
    setPhaseToStarted: vi.fn(),
    updatePhaseStatus: vi.fn(),
  };
});

vi.mock("../../dateUtilities.js", () => ({
  formatDateToPlainDate: vi.fn(),
}));

describe("skipConceptPhase", () => {
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
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Started");
  });

  it("should take the right actions when completing the Concept phase", async () => {
    const validateSkippedDateCall = [
      {
        applicationId: testApplicationId,
        applicationDates: [
          {
            dateType: "Concept Skipped Date",
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

    await skipConceptPhase(
      undefined,
      { applicationId: testApplicationId },
      { user: { id: "user-1" } }
    );

    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(checkConceptPhaseStartedBeforeSkipping).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Started"
    );
    expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      "Skipped",
      mockTransaction
    );
    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Application Intake",
      mockTransaction
    );
    expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual([
      validateSkippedDateCall,
      validateStartDateCall,
    ]);
    expect(handlePrismaError).not.toHaveBeenCalled();
  });

  it("should handle an error in the transaction appropriately if it occurs", async () => {
    vi.mocked(checkConceptPhaseStartedBeforeSkipping).mockImplementationOnce(() => {
      throw testError;
    });

    await expect(
      skipConceptPhase(undefined, { applicationId: testApplicationId }, { user: { id: "user-1" } })
    ).rejects.toThrowError(testHandlePrismaError);
    expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
  });

  it("should skip changing the date if the next phase is already started", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(false);
    const expectedDateCall = [
      [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Concept Skipped Date",
              plainDate: mockEasternToday,
            },
          ],
        },
        mockTransaction,
        __DEMOS_VERSION__,
      ],
    ];

    await skipConceptPhase(
      undefined,
      { applicationId: testApplicationId },
      { user: { id: "user-1" } }
    );

    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(checkConceptPhaseStartedBeforeSkipping).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Started"
    );
    expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      "Skipped",
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

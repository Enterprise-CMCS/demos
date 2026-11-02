import { getApplication } from "../application";
vi.mock("../email/notifyApplicationEvent", () => ({
  notifyApplicationStatusUpdated: vi.fn(),
}));
import { describe, it, expect, vi, beforeEach } from "vitest";
import { skipConceptPhase } from "./skipConceptPhase.js";
import { TZDate } from "@date-fns/tz";
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
import { EasternNow, getEasternNow } from "../../dateUtilities.js";

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

vi.mock("../../dateUtilities.js", async () => {
  const actual = await vi.importActual("../../dateUtilities.js");
  return {
    ...actual,
    getEasternNow: vi.fn(),
  };
});

describe("skipConceptPhase", () => {
  const mockTransaction: any = vi.fn();
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");
  const mockEasternPlainDate = "2025-01-13";
  const mockEasternStartOfDayDate = new Date("2025-01-13T00:00:00.000-05:00");
  const mockEasternCurrentTime = new Date("2025-01-13T07:19:23.199-05:00");
  const mockEasternEndOfDayDate = new Date("2025-01-13T23:59:59.999-05:00");
  const mockEasternValue: EasternNow = {
    "Start of Day": {
      isEasternTZDate: true,
      easternTZDate: new TZDate(mockEasternStartOfDayDate, "America/New_York"),
    },
    "End of Day": {
      isEasternTZDate: true,
      easternTZDate: new TZDate(mockEasternEndOfDayDate, "America/New_York"),
    },
    "Current Time": {
      isEasternTZDate: true,
      easternTZDate: new TZDate(mockEasternCurrentTime, "America/New_York"),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getApplication).mockResolvedValue({
      id: testApplicationId,
      statusId: "Under Review",
    } as Awaited<ReturnType<typeof getApplication>>);
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(getEasternNow).mockReturnValue(mockEasternValue);
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
            plainDate: mockEasternPlainDate,
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
            plainDate: mockEasternPlainDate,
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
              plainDate: mockEasternPlainDate,
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

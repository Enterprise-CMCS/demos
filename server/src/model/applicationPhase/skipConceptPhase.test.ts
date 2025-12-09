import { describe, it, expect, vi, beforeEach } from "vitest";
import { skipConceptPhase } from "./skipConceptPhase.js";
import { TZDate } from "@date-fns/tz";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { validateAndUpdateDates } from "../applicationDate";
import {
  checkConceptPhaseStartedBeforeSkipping,
  getApplicationPhaseStatus,
  startPhase,
  updatePhaseStatus,
} from ".";
import { EasternTZDate, getEasternNow } from "../../dateUtilities.js";

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
    startPhase: vi.fn(),
    updatePhaseStatus: vi.fn(),
  };
});

vi.mock("../../dateUtilities.js", () => ({
  getEasternNow: vi.fn(),
}));

describe("skipConceptPhase", () => {
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
    vi.mocked(startPhase).mockResolvedValue(true);
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Started");
  });

  it("should take the right actions when completing the Concept phase", async () => {
    const expectedDateCall = [
      [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Concept Skipped Date",
              dateValue: mockEasternStartOfDayDate,
            },
            {
              dateType: "Application Intake Start Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ],
    ];

    await skipConceptPhase(undefined, { applicationId: testApplicationId });

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
    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Application Intake",
      mockTransaction
    );
    expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual(expectedDateCall);
    expect(handlePrismaError).not.toHaveBeenCalled();
  });

  it("should handle an error in the transaction appropriately if it occurs", async () => {
    vi.mocked(checkConceptPhaseStartedBeforeSkipping).mockImplementationOnce(() => {
      throw testError;
    });

    await expect(
      skipConceptPhase(undefined, { applicationId: testApplicationId })
    ).rejects.toThrowError(testHandlePrismaError);
    expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
  });

  it("should skip changing the date if the next phase is already started", async () => {
    vi.mocked(startPhase).mockResolvedValue(false);
    const expectedDateCall = [
      [
        {
          applicationId: testApplicationId,
          applicationDates: [
            {
              dateType: "Concept Skipped Date",
              dateValue: mockEasternStartOfDayDate,
            },
          ],
        },
        mockTransaction,
      ],
    ];

    await skipConceptPhase(undefined, { applicationId: testApplicationId });

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
    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Application Intake",
      mockTransaction
    );
    expect(vi.mocked(validateAndUpdateDates).mock.calls).toEqual(expectedDateCall);
    expect(handlePrismaError).not.toHaveBeenCalled();
  });
});

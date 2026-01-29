import { describe, it, expect, vi, beforeEach } from "vitest";
import { declareCompletenessPhaseIncomplete } from "./declareCompletenessPhaseIncomplete.js";
import { TZDate } from "@date-fns/tz";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  getApplicationDates,
  ParsedApplicationDateInput,
  validateAndUpdateDates,
} from "../applicationDate";
import {
  ApplicationPhaseStatusRecord,
  checkApplicationIntakeStatusForIncomplete,
  checkCompletenessStatusForIncomplete,
  getApplicationPhaseStatuses,
  updatePhaseStatus,
} from ".";
import { ApplicationDateInput } from "../../types.js";

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
  getApplicationDates: vi.fn(),
  validateAndUpdateDates: vi.fn(),
}));

// The importActual line is necessary to avoid overwriting the constant
vi.mock(".", async () => {
  const actual = await vi.importActual(".");
  return {
    ...actual,
    checkApplicationIntakeStatusForIncomplete: vi.fn(),
    checkCompletenessStatusForIncomplete: vi.fn(),
    getApplicationPhaseStatuses: vi.fn(),
    updatePhaseStatus: vi.fn(),
  };
});

describe("declareCompletenessPhaseIncomplete", () => {
  const mockTransaction: any = vi.fn();
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };
  const testDate = new Date("2025-01-13T00:00:00.000-05:00");
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testError = new Error("Database connection failed");
  const mockExistingDates: ParsedApplicationDateInput[] = [
    {
      dateType: "Concept Start Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "Completeness Start Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "Completeness Completion Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "State Application Submitted Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "Completeness Review Due Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "Application Intake Completion Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "State Application Deemed Complete",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "Federal Comment Period Start Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
    {
      dateType: "Federal Comment Period End Date",
      dateValue: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(testDate, "America/New_York"),
      },
    },
  ];
  const mockPhaseStatuses: ApplicationPhaseStatusRecord = {
    Concept: "Completed",
    "Application Intake": "Completed",
    Completeness: "Started",
    "Federal Comment": "Not Started",
    "SDG Preparation": "Not Started",
    Review: "Not Started",
    "Approval Package": "Not Started",
    "Approval Summary": "Not Started",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    vi.mocked(getApplicationDates).mockResolvedValue(mockExistingDates);
    vi.mocked(getApplicationPhaseStatuses).mockResolvedValue(mockPhaseStatuses);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should make the Completeness phase Incomplete if all requirements are met", async () => {
    await declareCompletenessPhaseIncomplete(undefined, { applicationId: testApplicationId });

    expect(getApplicationDates).toHaveBeenCalledExactlyOnceWith(testApplicationId, mockTransaction);
    expect(getApplicationPhaseStatuses).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      mockTransaction
    );
    expect(checkApplicationIntakeStatusForIncomplete).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Completed"
    );
    expect(checkCompletenessStatusForIncomplete).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Started"
    );
    expect(vi.mocked(updatePhaseStatus).mock.calls).toEqual([
      [testApplicationId, "Completeness", "Incomplete", mockTransaction],
      [testApplicationId, "Application Intake", "Started", mockTransaction],
    ]);
    expect(handlePrismaError).not.toHaveBeenCalled();
  });

  it("should nullify all appropriate dates that exist", async () => {
    const expectedDateChanges: ApplicationDateInput[] = [
      {
        dateType: "Completeness Start Date",
        dateValue: null,
      },
      {
        dateType: "Completeness Completion Date",
        dateValue: null,
      },
      {
        dateType: "State Application Submitted Date",
        dateValue: null,
      },
      {
        dateType: "Completeness Review Due Date",
        dateValue: null,
      },
      {
        dateType: "Application Intake Completion Date",
        dateValue: null,
      },
      {
        dateType: "State Application Deemed Complete",
        dateValue: null,
      },
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: null,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: null,
      },
    ];

    await declareCompletenessPhaseIncomplete(undefined, { applicationId: testApplicationId });

    expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(
      {
        applicationId: testApplicationId,
        applicationDates: expectedDateChanges,
      },
      mockTransaction
    );
    expect(handlePrismaError).not.toHaveBeenCalled();
  });

  it("should handle an error in the transaction appropriately if it occurs", async () => {
    vi.mocked(checkCompletenessStatusForIncomplete).mockImplementationOnce(() => {
      throw testError;
    });

    await expect(
      declareCompletenessPhaseIncomplete(undefined, { applicationId: testApplicationId })
    ).rejects.toThrowError(testHandlePrismaError);
    expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
  });
});

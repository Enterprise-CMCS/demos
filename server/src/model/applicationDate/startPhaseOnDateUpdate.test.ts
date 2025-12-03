import { describe, it, expect, vi, beforeEach } from "vitest";
import { startPhaseOnDateUpdate } from "./startPhaseOnDateUpdate";
import { findNotStartedPhasesFromDates } from "../applicationPhase/queries/findNotStartedPhasesFromDates";
import { updatePhaseStatus } from "../applicationPhase";
import { createPhaseStartDate } from "./createPhaseStartDate";
import { PrismaTransactionClient } from "../../prismaClient";
import { SetApplicationDatesInput } from "./applicationDateSchema";
import { TZDate } from "@date-fns/tz";

// Mock the dependencies
vi.mock("../applicationPhase/queries/findNotStartedPhasesFromDates");
vi.mock("../applicationPhase");
vi.mock("./createPhaseStartDate");

describe("startPhaseOnDateUpdate", () => {
  let mockTx: PrismaTransactionClient;
  const applicationId = "test-app-id";
  const mockStartDate = new TZDate("2025-01-15T00:00:00-05:00");

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = {} as PrismaTransactionClient;
  });

  it("should start a phase and return its start date when a matching date is found", async () => {
    const input: SetApplicationDatesInput = {
      applicationId,
      applicationDates: [
        {
          dateType: "State Application Submitted Date",
          dateValue: mockStartDate,
        },
      ],
    };

    const mockQueryResults = [
      {
        phaseId: "Application Intake",
        phase: {
          phase: {
            phaseDateTypes: [
              {
                dateTypeId: "State Application Submitted Date",
              },
            ],
          },
        },
      },
    ];

    vi.mocked(findNotStartedPhasesFromDates).mockResolvedValue(mockQueryResults as any);
    vi.mocked(createPhaseStartDate).mockReturnValue({
      dateType: "Application Intake Start Date",
      dateValue: mockStartDate,
    });

    const result = await startPhaseOnDateUpdate(input, mockTx);

    expect(findNotStartedPhasesFromDates).toHaveBeenCalledWith(input, mockTx);
    expect(updatePhaseStatus).toHaveBeenCalledWith(
      applicationId,
      "Application Intake",
      "Started",
      mockTx
    );
    expect(createPhaseStartDate).toHaveBeenCalledWith("Application Intake");
    expect(result).toEqual([
      {
        dateType: "Application Intake Start Date",
        dateValue: mockStartDate,
      },
    ]);
  });

  it("should start multiple phases when multiple matching dates are found", async () => {
    const input: SetApplicationDatesInput = {
      applicationId,
      applicationDates: [
        {
          dateType: "State Application Submitted Date",
          dateValue: mockStartDate,
        },
        {
          dateType: "State Application Deemed Complete",
          dateValue: mockStartDate,
        },
      ],
    };

    const mockQueryResults = [
      {
        phaseId: "Application Intake",
        phase: {
          phase: {
            phaseDateTypes: [
              {
                dateTypeId: "State Application Submitted Date",
              },
            ],
          },
        },
      },
      {
        phaseId: "Completeness",
        phase: {
          phase: {
            phaseDateTypes: [
              {
                dateTypeId: "State Application Deemed Complete",
              },
            ],
          },
        },
      },
    ];

    vi.mocked(findNotStartedPhasesFromDates).mockResolvedValue(mockQueryResults as any);
    vi.mocked(createPhaseStartDate)
      .mockReturnValueOnce({
        dateType: "Application Intake Start Date",
        dateValue: mockStartDate,
      })
      .mockReturnValueOnce({
        dateType: "Completeness Start Date",
        dateValue: mockStartDate,
      });

    const result = await startPhaseOnDateUpdate(input, mockTx);

    expect(updatePhaseStatus).toHaveBeenCalledTimes(2);
    expect(updatePhaseStatus).toHaveBeenNthCalledWith(
      1,
      applicationId,
      "Application Intake",
      "Started",
      mockTx
    );
    expect(updatePhaseStatus).toHaveBeenNthCalledWith(
      2,
      applicationId,
      "Completeness",
      "Started",
      mockTx
    );
    expect(result).toHaveLength(2);
  });

  it("should only start the first phase when a date matches multiple phases", async () => {
    const input: SetApplicationDatesInput = {
      applicationId,
      applicationDates: [
        {
          dateType: "Expected Approval Date",
          dateValue: mockStartDate,
        },
      ],
    };

    const mockQueryResults = [
      {
        phaseId: "SDG Preparation",
        phase: {
          phase: {
            phaseDateTypes: [
              {
                dateTypeId: "Expected Approval Date",
              },
            ],
          },
        },
      },
      {
        phaseId: "Federal Comment",
        phase: {
          phase: {
            phaseDateTypes: [
              {
                dateTypeId: "Expected Approval Date",
              },
            ],
          },
        },
      },
    ];

    vi.mocked(findNotStartedPhasesFromDates).mockResolvedValue(mockQueryResults as any);
    vi.mocked(createPhaseStartDate).mockReturnValue({
      dateType: "SDG Preparation Start Date",
      dateValue: mockStartDate,
    });

    const result = await startPhaseOnDateUpdate(input, mockTx);

    // Should only start the first phase found (SDG Preparation)
    expect(updatePhaseStatus).toHaveBeenCalledTimes(1);
    expect(updatePhaseStatus).toHaveBeenCalledWith(
      applicationId,
      "SDG Preparation",
      "Started",
      mockTx
    );
    expect(result).toHaveLength(1);
  });

  it("should handle empty input dates", async () => {
    const input: SetApplicationDatesInput = {
      applicationId,
      applicationDates: [],
    };

    vi.mocked(findNotStartedPhasesFromDates).mockResolvedValue([]);

    const result = await startPhaseOnDateUpdate(input, mockTx);

    expect(result).toEqual([]);
    expect(updatePhaseStatus).not.toHaveBeenCalled();
    expect(createPhaseStartDate).not.toHaveBeenCalled();
  });
});

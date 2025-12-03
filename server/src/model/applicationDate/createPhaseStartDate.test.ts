import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPhaseStartDate } from "./createPhaseStartDate";
import { getEasternNow } from "../../dateUtilities";
import { PhaseNameWithTrackedStatus } from "../../types";
import { TZDate } from "@date-fns/tz";

// Mock the dateUtilities module
vi.mock("../../dateUtilities");

describe("createPhaseStartDate", () => {
  const mockStartOfDay = new TZDate("2025-01-15T00:00:00-05:00");
  const mockEndOfDay = new TZDate("2025-01-15T23:59:59-05:00");

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getEasternNow).mockReturnValue({
      "Start of Day": {
        isEasternTZDate: true,
        easternTZDate: mockStartOfDay,
      },
      "End of Day": {
        isEasternTZDate: true,
        easternTZDate: mockEndOfDay,
      },
    });
  });

  it("should return undefined for phases without a start date", () => {
    const phaseId: PhaseNameWithTrackedStatus = "Post Approval";

    const result = createPhaseStartDate(phaseId);

    expect(result).toBeUndefined();
  });

  it("should create Start Date for applicable Phase", () => {
    const phaseId: PhaseNameWithTrackedStatus = "Application Intake";

    const result = createPhaseStartDate(phaseId);

    expect(getEasternNow).toHaveBeenCalled();
    expect(result).toEqual({
      dateType: "Application Intake Start Date",
      dateValue: mockStartOfDay,
    });
  });

  it("should use Start of Day timestamp for all start dates", () => {
    const phases: PhaseNameWithTrackedStatus[] = [
      "Concept",
      "Application Intake",
      "Completeness",
      "Federal Comment",
      "SDG Preparation",
      "Review",
      "Approval Package",
    ];

    for (const phaseId of phases) {
      const result = createPhaseStartDate(phaseId);
      expect(result?.dateValue).toEqual(mockStartOfDay);
    }

    const postApprovalPhase: PhaseNameWithTrackedStatus = "Post Approval";
    const postApprovalResult = createPhaseStartDate(postApprovalPhase);
    expect(postApprovalResult).toBeUndefined();
  });
});

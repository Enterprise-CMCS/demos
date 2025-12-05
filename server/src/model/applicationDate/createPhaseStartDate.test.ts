import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPhaseStartDate } from "./createPhaseStartDate.js";
import { EasternNow } from "../../dateUtilities.js";
import { PhaseNameWithTrackedStatus } from "../../types.js";
import { PHASE_START_END_DATES } from "../../constants.js";

vi.mock("../../dateUtilities.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../dateUtilities.js")>();
  return {
    ...actual,
    getExpectedTimestampLabel: vi.fn(),
  };
});

import { getExpectedTimestampLabel } from "../../dateUtilities.js";
import { TZDate } from "@date-fns/tz";

describe("createPhaseStartDate", () => {
  const mockEasternNow: EasternNow = {
    "Start of Day": {
      easternTZDate: new TZDate("2025-01-01T05:00:00.000Z"),
      isEasternTZDate: true,
    },
    "End of Day": {
      easternTZDate: new TZDate("2025-01-02T04:59:59.999Z"),
      isEasternTZDate: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when phase has a start date", () => {
    it("should create ApplicationDateInput with Start of Day timestamp", () => {
      const phaseId: PhaseNameWithTrackedStatus = "Concept";
      vi.mocked(getExpectedTimestampLabel).mockReturnValue("Start of Day");

      const result = createPhaseStartDate(phaseId, mockEasternNow);

      expect(getExpectedTimestampLabel).toHaveBeenCalledExactlyOnceWith(
        PHASE_START_END_DATES[phaseId].startDate
      );
      expect(result).toEqual({
        dateType: PHASE_START_END_DATES[phaseId].startDate,
        dateValue: mockEasternNow["Start of Day"].easternTZDate,
      });
    });

    it("should create ApplicationDateInput with End of Day timestamp", () => {
      const phaseId: PhaseNameWithTrackedStatus = "Application Intake";
      vi.mocked(getExpectedTimestampLabel).mockReturnValue("End of Day");

      const result = createPhaseStartDate(phaseId, mockEasternNow);

      expect(getExpectedTimestampLabel).toHaveBeenCalledExactlyOnceWith(
        PHASE_START_END_DATES[phaseId].startDate
      );
      expect(result).toEqual({
        dateType: PHASE_START_END_DATES[phaseId].startDate,
        dateValue: mockEasternNow["End of Day"].easternTZDate,
      });
    });
  });

  describe("when phase has no start date", () => {
    it("should return null for phase without start date", () => {

      // post approval phase currently has no start date
      const phaseId = "Post Approval" as PhaseNameWithTrackedStatus;

      const result = createPhaseStartDate(phaseId, mockEasternNow);

      expect(result).toBeNull();
      expect(getExpectedTimestampLabel).not.toHaveBeenCalled();
    });
  });
});

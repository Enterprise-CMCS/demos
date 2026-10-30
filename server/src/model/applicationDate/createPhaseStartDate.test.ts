import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPhaseStartDate } from "./createPhaseStartDate.js";
import { PhaseName } from "../../types.js";
import { PHASE_START_END_DATES } from "../../constants.js";

vi.mock("../../dateUtilities.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../dateUtilities.js")>();
  return {
    ...actual,
    getDayBoundaryLabel: vi.fn(),
  };
});

import { getDayBoundaryLabel } from "../../dateUtilities.js";

describe("createPhaseStartDate", () => {
  const mockEasternToday = "2025-01-01";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when phase has a start date", () => {
    it("should create ApplicationDateInput with Start of Day timestamp", () => {
      const phaseId: PhaseName = "Concept";
      vi.mocked(getDayBoundaryLabel).mockReturnValue("Start of Day");

      const result = createPhaseStartDate(phaseId, mockEasternToday);

      expect(result).toEqual({
        dateType: PHASE_START_END_DATES[phaseId].startDate,
        plainDate: mockEasternToday,
      });
    });

    it("should create ApplicationDateInput with End of Day timestamp", () => {
      const phaseId: PhaseName = "Application Intake";
      vi.mocked(getDayBoundaryLabel).mockReturnValue("End of Day");

      const result = createPhaseStartDate(phaseId, mockEasternToday);

      expect(result).toEqual({
        dateType: PHASE_START_END_DATES[phaseId].startDate,
        plainDate: mockEasternToday,
      });
    });
  });
});

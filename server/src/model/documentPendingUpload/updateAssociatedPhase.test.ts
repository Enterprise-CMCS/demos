import { beforeEach, describe, expect, it, vi } from "vitest";
import { TZDate } from "@date-fns/tz";
import { updateAssociatedPhase } from "./updateAssociatedPhase";
import type { EasternNow } from "../../dateUtilities";
import { ApplicationDateInput } from "../../types";
import { __DEMOS_VERSION__ } from "../../flags";

vi.mock("../applicationPhase", () => ({
  startPhase: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  validateAndUpdateDates: vi.fn(),
}));

vi.mock("../../dateUtilities", () => ({
  getEasternNow: vi.fn(),
}));

import { startPhase } from "../applicationPhase";
import { validateAndUpdateDates } from "../applicationDate";
import { getEasternNow } from "../../dateUtilities";

describe("updateAssociatedPhase", () => {
  const mockTransaction = {} as any;
  const testApplicationId = "application-123";
  const testPhaseName = "Concept";
  const mockEasternNow: EasternNow = {
    "End of Day": {
      easternTZDate: new TZDate("2026-04-27T23:59:59.999-04:00", "America/New_York"),
      isEasternTZDate: true,
    },
    "Start of Day": {
      easternTZDate: new TZDate("2026-04-27T00:00:00.000-04:00", "America/New_York"),
      isEasternTZDate: true,
    },
    "Current Time": {
      easternTZDate: new TZDate("2026-04-27T10:04:19.232-04:00", "America/New_York"),
      isEasternTZDate: true,
    },
  };
  const mockPhaseStartDate: ApplicationDateInput = {
    dateType: "Concept Completion Date",
    plainDate: "2026-04-27",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getEasternNow).mockReturnValue(mockEasternNow);
    vi.mocked(startPhase).mockResolvedValue(mockPhaseStartDate);
  });

  it("should call startPhase with correct parameters", async () => {
    await updateAssociatedPhase(mockTransaction, testApplicationId, testPhaseName);

    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId,
      testPhaseName,
      mockEasternNow
    );
  });

  it("should not call validateAndUpdateDates when phase start date is null", async () => {
    vi.mocked(startPhase).mockResolvedValue(null);

    await updateAssociatedPhase(mockTransaction, testApplicationId, testPhaseName);

    expect(validateAndUpdateDates).not.toHaveBeenCalled();
  });

  it("should call validateAndUpdateDates when phase start date is not null", async () => {
    await updateAssociatedPhase(mockTransaction, testApplicationId, testPhaseName);

    expect(validateAndUpdateDates).toHaveBeenCalledExactlyOnceWith(
      {
        applicationId: testApplicationId,
        applicationDates: [mockPhaseStartDate],
      },
      mockTransaction,
      __DEMOS_VERSION__
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAssociatedPhase } from "./updateAssociatedPhase";
import { ApplicationDateInput } from "../../types";
import { __DEMOS_VERSION__ } from "../../flags";

vi.mock("../applicationPhase", () => ({
  startPhase: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  validateAndUpdateDates: vi.fn(),
}));

vi.mock("../../dateUtilities", () => ({
  formatDateToPlainDate: vi.fn(),
}));

import { startPhase } from "../applicationPhase";
import { validateAndUpdateDates } from "../applicationDate";
import { formatDateToPlainDate } from "../../dateUtilities";

describe("updateAssociatedPhase", () => {
  const mockTransaction = {} as any;
  const testApplicationId = "application-123";
  const testPhaseName = "Concept";
  const mockEasternToday = "2026-04-27";
  const mockPhaseStartDate: ApplicationDateInput = {
    dateType: "Concept Completion Date",
    plainDate: "2026-04-27",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(formatDateToPlainDate).mockReturnValue(mockEasternToday);
    vi.mocked(startPhase).mockResolvedValue(mockPhaseStartDate);
  });

  it("should call startPhase with correct parameters", async () => {
    await updateAssociatedPhase(mockTransaction, testApplicationId, testPhaseName);

    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId,
      testPhaseName,
      mockEasternToday
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

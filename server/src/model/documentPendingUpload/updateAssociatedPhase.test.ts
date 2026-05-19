import { beforeEach, describe, expect, it, vi } from "vitest";
import { TZDate } from "@date-fns/tz";
import { updateAssociatedPhase } from "./updateAssociatedPhase";
import { EasternNow } from "../../dateUtilities";

const mockTransaction = {} as any;
const testApplicationId = "application-123";
const testPhaseName = "Concept";

const mockNow = new Date(2026, 3, 27, 10, 4, 19, 232);
const mockEasternNow: EasternNow = {
  "End of Day": {
    easternTZDate: new TZDate(mockNow),
    isEasternTZDate: true,
  },
  "Start of Day": {
    easternTZDate: new TZDate(mockNow),
    isEasternTZDate: true,
  },
  "Current Time": {
    easternTZDate: new TZDate(mockNow),
    isEasternTZDate: true,
  },
};

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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEasternNow).mockReturnValue(mockEasternNow);
  });

  it("should call startPhase with correct parameters", async () => {
    vi.mocked(getEasternNow).mockReturnValue(mockEasternNow);
    await updateAssociatedPhase(mockTransaction, testApplicationId, testPhaseName);
    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId,
      testPhaseName,
      mockEasternNow
    );
  });

  it("should not call validateAndUpdateDates when phase start date is null", async () => {
    await updateAssociatedPhase(mockTransaction, testApplicationId, testPhaseName);

    vi.mocked(startPhase).mockResolvedValueOnce(null);

    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testApplicationId,
      testPhaseName,
      mockEasternNow
    );
    expect(validateAndUpdateDates).not.toHaveBeenCalled();
  });
});

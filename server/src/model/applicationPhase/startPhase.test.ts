import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { ApplicationDateInput, PhaseName } from "../../types";
import { EasternNow } from "../../dateUtilities";
import { startPhase } from "./startPhase";

// Mock imports
import { setPhaseToStarted } from ".";
import { createPhaseStartDate } from "../applicationDate";

vi.mock(".", () => ({
  setPhaseToStarted: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  createPhaseStartDate: vi.fn(),
}));

describe("startPhaseByDocument", () => {
  const mockTransaction = "mockTransaction" as any;
  const testApplicationId = "app-123-456";
  const mockPhaseName: PhaseName = "Concept";
  const mockEasternNow: EasternNow = {
    "End of Day": {
      easternTZDate: new TZDate("2025-01-15T23:59:59.999-05:00", "America/New_York"),
      isEasternTZDate: true,
    },
    "Start of Day": {
      easternTZDate: new TZDate("2025-01-15T00:00:00.000-05:00", "America/New_York"),
      isEasternTZDate: true,
    },
    "Current Time": {
      easternTZDate: new TZDate("2025-01-15T11:29:14.978-05:00", "America/New_York"),
      isEasternTZDate: true,
    },
  };

  const mockPhaseStartDate: ApplicationDateInput = {
    dateType: "Application Intake Completion Date",
    dateValue: new TZDate("2025-01-20"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should start phase and return start date when phase is successfully started", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(mockPhaseStartDate);

    const result = await startPhase(
      mockTransaction,
      testApplicationId,
      mockPhaseName,
      mockEasternNow
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternNow);
    expect(result).toEqual(mockPhaseStartDate);
  });

  it("should return null when phase is not started", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(false);

    const result = await startPhase(
      mockTransaction,
      testApplicationId,
      mockPhaseName,
      mockEasternNow
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("should return null when createPhaseStartDate returns null", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(null);

    const result = await startPhase(
      mockTransaction,
      testApplicationId,
      mockPhaseName,
      mockEasternNow
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternNow);
    expect(result).toBeNull();
  });
});

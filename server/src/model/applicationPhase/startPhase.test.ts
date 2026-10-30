import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationDateInput, PhaseName } from "../../types";
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
  const mockEasternToday = "2025-01-15";

  const mockPhaseStartDate: ApplicationDateInput = {
    dateType: "Application Intake Completion Date",
    plainDate: "2025-01-20",
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
      mockEasternToday
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternToday);
    expect(result).toEqual(mockPhaseStartDate);
  });

  it("should return null when phase is not started", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(false);

    const result = await startPhase(
      mockTransaction,
      testApplicationId,
      mockPhaseName,
      mockEasternToday
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
      mockEasternToday
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternToday);
    expect(result).toBeNull();
  });
});

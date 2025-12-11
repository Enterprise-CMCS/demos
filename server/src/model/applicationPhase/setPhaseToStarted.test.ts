import { describe, it, expect, vi, beforeEach } from "vitest";
import { setPhaseToStarted } from "./setPhaseToStarted";
import { PhaseNameWithTrackedStatus } from "../../types";

// Mock imports
import { getApplicationPhaseStatus, updatePhaseStatus } from "./index.js";

vi.mock(".", () => ({
  getApplicationPhaseStatus: vi.fn(),
  updatePhaseStatus: vi.fn(),
}));

describe("setPhaseToStarted", () => {
  const testApplicationId: string = "3ed9d466-0563-4634-959f-b9f86f659905";
  const testPhaseName: PhaseNameWithTrackedStatus = "Review";
  const mockTransaction: any = "A mock transaction";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should pull the status and update it if it is Not Started", async () => {
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Not Started");

    const result = await setPhaseToStarted(testApplicationId, testPhaseName, mockTransaction);

    expect(result).toEqual(true);
    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      testPhaseName,
      mockTransaction
    );
    expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      testPhaseName,
      "Started",
      mockTransaction
    );
  });

  it("should do nothing if the phase is a status other than Not Started", async () => {
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Completed");

    const result = await setPhaseToStarted(testApplicationId, testPhaseName, mockTransaction);

    expect(result).toEqual(false);
    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      testPhaseName,
      mockTransaction
    );
    expect(updatePhaseStatus).not.toBeCalled();
  });

  it("should start Completeness phase when status is Incomplete", async () => {
    const completenessPhase: PhaseNameWithTrackedStatus = "Completeness";
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Incomplete");

    const result = await setPhaseToStarted(testApplicationId, completenessPhase, mockTransaction);

    expect(result).toEqual(true);
    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      completenessPhase,
      mockTransaction
    );
    expect(updatePhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      completenessPhase,
      "Started",
      mockTransaction
    );
  });

  it("should not start non-Completeness phase when status is Incomplete", async () => {
    const nonCompletenessPhase: PhaseNameWithTrackedStatus = "Application Intake";
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Incomplete");

    const result = await setPhaseToStarted(
      testApplicationId,
      nonCompletenessPhase,
      mockTransaction
    );

    expect(result).toEqual(false);
    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      nonCompletenessPhase,
      mockTransaction
    );
    expect(updatePhaseStatus).not.toHaveBeenCalled();
  });
});

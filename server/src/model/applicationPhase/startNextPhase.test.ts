import { describe, it, expect, vi, beforeEach } from "vitest";
import { startNextPhase } from "./startNextPhase.js";
import { PhaseNameWithTrackedStatus } from "../../types.js";

// Mock imports
import { getApplicationPhaseStatus, updatePhaseStatus } from ".";

vi.mock(".", () => ({
  getApplicationPhaseStatus: vi.fn(),
  updatePhaseStatus: vi.fn(),
}));

describe("startNextPhase", () => {
  const testApplicationId: string = "3ed9d466-0563-4634-959f-b9f86f659905";
  const testPhaseName: PhaseNameWithTrackedStatus = "OGC & OMB Review";
  const mockTransaction: any = "A mock transaction";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should pull the status and update it if it is Not Started", async () => {
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Not Started");

    const result = await startNextPhase(testApplicationId, testPhaseName, mockTransaction);

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

    const result = await startNextPhase(testApplicationId, testPhaseName, mockTransaction);

    expect(result).toEqual(false);
    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      testPhaseName,
      mockTransaction
    );
    expect(updatePhaseStatus).not.toBeCalled();
  });
});

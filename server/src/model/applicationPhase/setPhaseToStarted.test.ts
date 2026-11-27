import { describe, it, expect, vi, beforeEach } from "vitest";
import { setPhaseToStarted } from "./setPhaseToStarted";
import { PhaseName } from "../../types";

// Mock imports
import { getApplicationPhaseStatus, updatePhaseStatus } from "./index.js";
import { insertApplicationAction } from "../applicationAction/queries";

vi.mock(".", () => ({
  getApplicationPhaseStatus: vi.fn(),
  updatePhaseStatus: vi.fn(),
}));

vi.mock("../applicationAction/queries", () => ({
  insertApplicationAction: vi.fn(),
}));

describe("setPhaseToStarted", () => {
  const testApplicationId: string = "3ed9d466-0563-4634-959f-b9f86f659905";
  const testPhaseName: PhaseName = "Review";
  const testUserId: string = "user-123";
  const mockTransaction: any = "A mock transaction";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should pull the status and update it if it is Not Started", async () => {
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Not Started");

    const result = await setPhaseToStarted(
      testApplicationId,
      testPhaseName,
      testUserId,
      mockTransaction
    );

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
    expect(insertApplicationAction).toHaveBeenCalledExactlyOnceWith(
      {
        applicationId: testApplicationId,
        actionType: "Started Review Phase",
        userId: testUserId,
      },
      mockTransaction
    );
  });

  it("should do nothing if the phase is a status other than Not Started", async () => {
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Completed");

    const result = await setPhaseToStarted(
      testApplicationId,
      testPhaseName,
      testUserId,
      mockTransaction
    );

    expect(result).toEqual(false);
    expect(getApplicationPhaseStatus).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      testPhaseName,
      mockTransaction
    );
    expect(updatePhaseStatus).not.toBeCalled();
  });

  it("should skip all processing for the Federal Comment phase", async () => {
    const result = await setPhaseToStarted(
      testApplicationId,
      "Federal Comment",
      testUserId,
      mockTransaction
    );

    expect(result).toEqual(false);
    expect(getApplicationPhaseStatus).not.toHaveBeenCalled();
    expect(updatePhaseStatus).not.toBeCalled();
    expect(insertApplicationAction).not.toHaveBeenCalled();
  });

  it("should skip all processing for the Concept phase", async () => {
    const result = await setPhaseToStarted(
      testApplicationId,
      "Concept",
      testUserId,
      mockTransaction
    );

    expect(result).toEqual(false);
    expect(getApplicationPhaseStatus).not.toHaveBeenCalled();
    expect(updatePhaseStatus).not.toBeCalled();
    expect(insertApplicationAction).not.toHaveBeenCalled();
  });

  it("should start Completeness phase when status is Incomplete", async () => {
    const completenessPhase: PhaseName = "Completeness";
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Incomplete");

    const result = await setPhaseToStarted(
      testApplicationId,
      completenessPhase,
      testUserId,
      mockTransaction
    );

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
    expect(insertApplicationAction).toHaveBeenCalledExactlyOnceWith(
      {
        applicationId: testApplicationId,
        actionType: "Started Completeness Phase",
        userId: testUserId,
      },
      mockTransaction
    );
  });

  it("should not start non-Completeness phase when status is Incomplete", async () => {
    const nonCompletenessPhase: PhaseName = "Application Intake";
    vi.mocked(getApplicationPhaseStatus).mockResolvedValue("Incomplete");

    const result = await setPhaseToStarted(
      testApplicationId,
      nonCompletenessPhase,
      testUserId,
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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePhaseStatus } from "./updatePhaseStatus.js";
import { PhaseNameWithTrackedStatus } from "../../../types.js";

describe("updatePhaseStatus", () => {
  const transactionMocks = {
    applicationPhase: {
      update: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationPhase: {
      update: transactionMocks.applicationPhase.update,
    },
  } as any;
  const testApplicationId: string = "9d663828-20b3-4911-9b8f-d537e9ddeda3";
  const testPhaseName: PhaseNameWithTrackedStatus = "Completeness";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request dates for the application from the database", async () => {
    const expectedCall = {
      where: {
        applicationId_phaseId: {
          applicationId: testApplicationId,
          phaseId: testPhaseName,
        },
      },
      data: {
        phaseStatusId: "Started",
      },
    };

    await updatePhaseStatus(testApplicationId, testPhaseName, "Started", mockTransaction);
    expect(transactionMocks.applicationPhase.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

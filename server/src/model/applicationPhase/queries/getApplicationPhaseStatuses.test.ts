import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApplicationPhaseStatuses } from "./getApplicationPhaseStatuses.js";

describe("getApplicationPhaseStatuses", () => {
  const transactionMocks = {
    applicationPhase: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationPhase: {
      findMany: transactionMocks.applicationPhase.findMany,
    },
  } as any;
  const testApplicationId: string = "2833603e-0f61-4d18-a74d-08e8f22ffed3";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request dates for the application from the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.applicationPhase.findMany).mockResolvedValue([
      {
        phaseId: "Concept",
        phaseStatusId: "Not Started",
      },
      {
        phaseId: "Application Intake",
        phaseStatusId: "Completed",
      },
    ]);
    const expectedCall = {
      select: {
        phaseId: true,
        phaseStatusId: true,
      },
      where: {
        applicationId: testApplicationId,
      },
    };

    await getApplicationPhaseStatuses(testApplicationId, mockTransaction);
    expect(transactionMocks.applicationPhase.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

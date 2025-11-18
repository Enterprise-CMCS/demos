import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApplicationPhaseStatus } from "./getApplicationPhaseStatus.js";

describe("getApplicationPhaseStatus", () => {
  const transactionMocks = {
    applicationPhase: {
      findUnique: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationPhase: {
      findUnique: transactionMocks.applicationPhase.findUnique,
    },
  } as any;
  const testApplicationId: string = "74b0bbb3-6c65-4be7-9481-86c49917b2ff";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request dates for the application from the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.applicationPhase.findUnique).mockResolvedValue({
      phaseStatusId: "Not Started",
    });
    const expectedCall = {
      select: {
        phaseStatusId: true,
      },
      where: {
        applicationId_phaseId: {
          applicationId: testApplicationId,
          phaseId: "Concept",
        },
      },
    };

    await getApplicationPhaseStatus(testApplicationId, "Concept", mockTransaction);
    expect(transactionMocks.applicationPhase.findUnique).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

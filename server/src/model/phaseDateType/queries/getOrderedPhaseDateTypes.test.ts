import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrderedPhaseDateTypes } from "../";

describe("getOrderedPhaseDateTypes", () => {
  const transactionMocks = {
    phaseDateType: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    phaseDateType: {
      findMany: transactionMocks.phaseDateType.findMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request phase date types ordered by phase number from the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([
      {
        phaseId: "Concept",
        dateTypeId: "Concept Start Date",
      },
      {
        phaseId: "Application Intake",
        dateTypeId: "Application Intake Start Date",
      },
    ]);
    const expectedCall = {
      select: {
        dateTypeId: true,
        phaseId: true,
      },
      orderBy: {
        phase: {
          phaseNumber: "asc",
        },
      },
    };

    await getOrderedPhaseDateTypes(mockTransaction);
    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

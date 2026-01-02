import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryApplicationDateTypesOnFinishedPhases } from "./queryApplicationDateTypesOnFinishedPhases.js";
import { DateType, PhaseStatus } from "../../../types.js";

describe("queryApplicationDateTypesOnFinishedPhases", () => {
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

  it("should request phase date types on finished phases with special handling for Concept phase", async () => {
    const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
    const testDateTypes: DateType[] = ["Concept Start Date", "Federal Comment Period Start Date"];

    // The mock return value is to support the function's return
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([
      {
        phaseId: "Concept",
        dateTypeId: "Concept Start Date",
      },
      {
        phaseId: "Federal Comment Period",
        dateTypeId: "Federal Comment Period Start Date",
      },
    ]);

    const expectedCall = {
      where: {
        dateTypeId: { in: testDateTypes },
        phase: {
          applicationPhaseTypeLimit: {
            some: {
              applicationPhases: {
                some: {
                  applicationId: testApplicationId,
                  phaseStatusId: {
                    in: ["Completed" satisfies PhaseStatus, "Skipped" satisfies PhaseStatus],
                  },
                },
              },
            },
          },
        },
      },
      select: {
        phaseId: true,
        dateTypeId: true,
      },
    };

    await queryApplicationDateTypesOnFinishedPhases(
      mockTransaction,
      testApplicationId,
      testDateTypes
    );
    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

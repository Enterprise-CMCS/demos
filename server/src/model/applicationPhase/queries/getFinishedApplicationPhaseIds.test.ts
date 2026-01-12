import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFinishedApplicationPhaseIds } from "./getFinishedApplicationPhaseIds";
import { PhaseName, PhaseStatus } from "../../../types";

describe("getCompletedApplicationPhaseIds", () => {
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

  it("should request completed phases for the application from the database", async () => {
    vi.mocked(transactionMocks.applicationPhase.findMany).mockResolvedValue([
      {
        phaseId: "Application Intake",
      },
      {
        phaseId: "Review",
      },
    ]);
    const expectedCall = {
      where: {
        applicationId: testApplicationId,
        phaseStatusId: { in: ["Completed", "Skipped"] },
      },
      select: {
        phaseId: true,
      },
    };

    const result: PhaseName[] = await getFinishedApplicationPhaseIds(
      mockTransaction,
      testApplicationId
    );
    expect(transactionMocks.applicationPhase.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(result).toEqual(["Application Intake", "Review"] satisfies PhaseName[]);
  });

  it("should return an empty array when no phases are completed", async () => {
    vi.mocked(transactionMocks.applicationPhase.findMany).mockResolvedValue([]);

    const result: PhaseName[] = await getFinishedApplicationPhaseIds(
      mockTransaction,
      testApplicationId
    );

    expect(result).toEqual([] satisfies PhaseName[]);
  });

  it("should return a single completed phase", async () => {
    vi.mocked(transactionMocks.applicationPhase.findMany).mockResolvedValue([
      {
        phaseId: "Concept",
      },
    ]);

    const result: PhaseName[] = await getFinishedApplicationPhaseIds(
      mockTransaction,
      testApplicationId
    );

    expect(result).toEqual(["Concept"] satisfies PhaseName[]);
  });

  it("should return multiple completed phases", async () => {
    vi.mocked(transactionMocks.applicationPhase.findMany).mockResolvedValue([
      {
        phaseId: "Application Intake",
      },
      {
        phaseId: "Review",
      },
      {
        phaseId: "Concept",
      },
      {
        phaseId: "SDG Preparation",
      },
    ]);

    const result: PhaseName[] = await getFinishedApplicationPhaseIds(
      mockTransaction,
      testApplicationId
    );

    expect(result).toHaveLength(4);
    expect(result).toEqual(
      expect.arrayContaining([
        "Application Intake",
        "Review",
        "Concept",
        "SDG Preparation",
      ] satisfies PhaseName[])
    );
  });
});

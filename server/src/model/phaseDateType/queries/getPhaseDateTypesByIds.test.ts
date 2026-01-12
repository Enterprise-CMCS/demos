import { describe, it, expect, vi } from "vitest";
import { getPhaseDateTypesByIds } from "./getPhaseDateTypesByIds";
import { DateType, PhaseName } from "../../../types";

describe("getPhaseDateTypesByIds", () => {
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

  it("should request phase date types matching the given phases and date types from the database", async () => {
    const expectedCall = {
      where: {
        phaseId: { in: ["Review", "Completeness"] },
        dateTypeId: { in: ["State Concurrence", "State Application Deemed Complete"] },
      },
      select: {
        phaseId: true,
        dateTypeId: true,
      },
    };

    await getPhaseDateTypesByIds(
      mockTransaction,
      ["Review", "Completeness"] satisfies PhaseName[],
      ["State Concurrence", "State Application Deemed Complete"] satisfies DateType[]
    );
    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should handle empty phase array", async () => {
    const expectedCall = {
      where: {
        phaseId: { in: [] },
        dateTypeId: { in: ["State Concurrence"] },
      },
      select: {
        phaseId: true,
        dateTypeId: true,
      },
    };

    await getPhaseDateTypesByIds(mockTransaction, [], ["State Concurrence"] satisfies DateType[]);
    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should handle empty date types array", async () => {
    const expectedCall = {
      where: {
        phaseId: { in: ["Review"] },
        dateTypeId: { in: [] },
      },
      select: {
        phaseId: true,
        dateTypeId: true,
      },
    };

    await getPhaseDateTypesByIds(mockTransaction, ["Review"] satisfies PhaseName[], []);
    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("should handle empty phase id and empty date types array", async () => {
    const expectedCall = {
      where: {
        phaseId: { in: [] },
        dateTypeId: { in: [] },
      },
      select: {
        phaseId: true,
        dateTypeId: true,
      },
    };

    await getPhaseDateTypesByIds(mockTransaction, [], []);
    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

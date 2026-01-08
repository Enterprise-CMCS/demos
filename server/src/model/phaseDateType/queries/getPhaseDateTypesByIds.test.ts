import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPhaseDateTypesByIds, PhaseDateType } from "./getPhaseDateTypesByIds";

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

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request phase date types matching the given phases and date types from the database", async () => {
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "Completeness",
        dateTypeId: "State Application Deemed Complete",
      },
    ]);
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

    const result: PhaseDateType[] = await getPhaseDateTypesByIds(
      mockTransaction,
      ["Review", "Completeness"],
      ["State Concurrence", "State Application Deemed Complete"]
    );
    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "Completeness",
        dateTypeId: "State Application Deemed Complete",
      },
    ] satisfies PhaseDateType[]);
  });

  it("should return an empty array when no matches are found", async () => {
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([]);

    const result: PhaseDateType[] = await getPhaseDateTypesByIds(
      mockTransaction,
      ["Review"],
      ["State Concurrence"]
    );

    expect(result).toEqual([]);
  });

  it("should handle single phase and date type", async () => {
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
    ]);

    const result: PhaseDateType[] = await getPhaseDateTypesByIds(
      mockTransaction,
      ["Review"],
      ["State Concurrence"]
    );

    expect(result).toEqual([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
    ] satisfies PhaseDateType[]);
  });

  it("should handle multiple phases with single date type", async () => {
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "Completeness",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "SDG Preparation",
        dateTypeId: "State Concurrence",
      },
    ]);

    const result: PhaseDateType[] = await getPhaseDateTypesByIds(
      mockTransaction,
      ["Review", "Completeness", "SDG Preparation"],
      ["State Concurrence"]
    );

    expect(result).toEqual([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "Completeness",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "SDG Preparation",
        dateTypeId: "State Concurrence",
      },
    ] satisfies PhaseDateType[]);
  });

  it("should handle single phase with multiple date types", async () => {
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "Review",
        dateTypeId: "DDME Approval Received",
      },
      {
        phaseId: "Review",
        dateTypeId: "Draft Approval Package Shared",
      },
    ]);

    const result: PhaseDateType[] = await getPhaseDateTypesByIds(
      mockTransaction,
      ["Review"],
      ["State Concurrence", "DDME Approval Received", "Draft Approval Package Shared"]
    );

    expect(result).toEqual([
      {
        phaseId: "Review",
        dateTypeId: "State Concurrence",
      },
      {
        phaseId: "Review",
        dateTypeId: "DDME Approval Received",
      },
      {
        phaseId: "Review",
        dateTypeId: "Draft Approval Package Shared",
      },
    ] satisfies PhaseDateType[]);
  });

  it("should handle empty phase array", async () => {
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([]);
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

    const result: PhaseDateType[] = await getPhaseDateTypesByIds(
      mockTransaction,
      [],
      ["State Concurrence"]
    );

    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([] satisfies PhaseDateType[]);
  });

  it("should handle empty date types array", async () => {
    vi.mocked(transactionMocks.phaseDateType.findMany).mockResolvedValue([]);
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

    const result: PhaseDateType[] = await getPhaseDateTypesByIds(mockTransaction, ["Review"], []);

    expect(transactionMocks.phaseDateType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([] satisfies PhaseDateType[]);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPhaseNoteTypes } from "./getPhaseNoteTypes";
import { PhaseNoteType } from "./getPhaseNoteTypes";

describe("getPhaseNoteTypes", () => {
  const transactionMocks = {
    phaseNoteType: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    phaseNoteType: {
      findMany: transactionMocks.phaseNoteType.findMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request phase note types matching the given phases and note types from the database", async () => {
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "Concept",
        noteTypeId: "OGC and OMB",
      },
    ]);
    const expectedCall = {
      where: {
        phaseId: { in: ["Review", "Concept"] },
        noteTypeId: { in: ["PO and OGD", "OGC and OMB"] },
      },
      select: {
        phaseId: true,
        noteTypeId: true,
      },
    };

    const result: PhaseNoteType[] = await getPhaseNoteTypes(
      mockTransaction,
      ["Review", "Concept"],
      ["PO and OGD", "OGC and OMB"]
    );
    expect(transactionMocks.phaseNoteType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "Concept",
        noteTypeId: "OGC and OMB",
      },
    ] satisfies PhaseNoteType[]);
  });

  it("should return an empty array when no matches are found", async () => {
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([]);

    const result: PhaseNoteType[] = await getPhaseNoteTypes(
      mockTransaction,
      ["Review"],
      ["PO and OGD"]
    );

    expect(result).toEqual([]);
  });

  it("should handle single phase and note type", async () => {
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
    ]);

    const result: PhaseNoteType[] = await getPhaseNoteTypes(
      mockTransaction,
      ["Review"],
      ["PO and OGD"]
    );

    expect(result).toEqual([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
    ] satisfies PhaseNoteType[]);
  });

  it("should handle multiple phases with single note type", async () => {
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "Concept",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "SDG Preparation",
        noteTypeId: "PO and OGD",
      },
    ]);

    const result: PhaseNoteType[] = await getPhaseNoteTypes(
      mockTransaction,
      ["Review", "Concept", "SDG Preparation"],
      ["PO and OGD"]
    );

    expect(result).toEqual([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "Concept",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "SDG Preparation",
        noteTypeId: "PO and OGD",
      },
    ] satisfies PhaseNoteType[]);
  });

  it("should handle single phase with multiple note types", async () => {
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "Review",
        noteTypeId: "OGC and OMB",
      },
      {
        phaseId: "Review",
        noteTypeId: "CMS (OSORA) Clearance",
      },
    ]);

    const result: PhaseNoteType[] = await getPhaseNoteTypes(
      mockTransaction,
      ["Review"],
      ["PO and OGD", "OGC and OMB", "CMS (OSORA) Clearance"]
    );

    expect(result).toEqual([
      {
        phaseId: "Review",
        noteTypeId: "PO and OGD",
      },
      {
        phaseId: "Review",
        noteTypeId: "OGC and OMB",
      },
      {
        phaseId: "Review",
        noteTypeId: "CMS (OSORA) Clearance",
      },
    ] satisfies PhaseNoteType[]);
  });

  it("should handle empty phase array", async () => {
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([]);
    const expectedCall = {
      where: {
        phaseId: { in: [] },
        noteTypeId: { in: ["PO and OGD"] },
      },
      select: {
        phaseId: true,
        noteTypeId: true,
      },
    };

    const result: PhaseNoteType[] = await getPhaseNoteTypes(mockTransaction, [], ["PO and OGD"]);

    expect(transactionMocks.phaseNoteType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([] satisfies PhaseNoteType[]);
  });

  it("should handle empty note types array", async () => {
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([]);
    const expectedCall = {
      where: {
        phaseId: { in: ["Review"] },
        noteTypeId: { in: [] },
      },
      select: {
        phaseId: true,
        noteTypeId: true,
      },
    };

    const result: PhaseNoteType[] = await getPhaseNoteTypes(mockTransaction, ["Review"], []);

    expect(transactionMocks.phaseNoteType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([] satisfies PhaseNoteType[]);
  });
});

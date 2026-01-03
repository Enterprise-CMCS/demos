import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryApplicationNoteTypesOnFinishedPhases } from "./queryApplicationNoteTypesOnFinishedPhases.js";
import { NoteType, PhaseStatus } from "../../../types.js";

describe("queryApplicationNoteTypesOnFinishedPhases", () => {
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

  it("should request phase note types on finished phases with special handling for Concept phase", async () => {
    const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
    const testNoteTypes: NoteType[] = ["PO and OGD", "COMMs Clearance"];

    // The mock return value is to support the function's return
    vi.mocked(transactionMocks.phaseNoteType.findMany).mockResolvedValue([
      {
        phaseId: "Concept",
        noteTypeId: "Concept Start Note",
      },
      {
        phaseId: "Federal Comment Period",
        noteTypeId: "Federal Comment Period Start Note",
      },
    ]);

    const expectedCall = {
      where: {
        noteTypeId: { in: testNoteTypes },
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
        noteTypeId: true,
      },
    };

    await queryApplicationNoteTypesOnFinishedPhases(
      mockTransaction,
      testApplicationId,
      testNoteTypes
    );
    expect(transactionMocks.phaseNoteType.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

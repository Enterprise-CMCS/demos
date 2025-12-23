import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteApplicationNotes } from "./deleteApplicationNotes.js";
import { ParsedSetApplicationNotesInput } from "../parseSetApplicationNotesInput.js";

describe("deleteApplicationNotes", () => {
  const transactionMocks = {
    applicationNote: {
      delete: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationNote: {
      delete: transactionMocks.applicationNote.delete,
    },
  } as any;
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete removed notes", async () => {
    const testInput: ParsedSetApplicationNotesInput = {
      applicationId: testApplicationId,
      applicationNotesToUpsert: [],
      applicationNotesToDelete: ["PO and OGD", "OGC and OMB"],
    };
    const expectedCalls = [
      [
        {
          where: {
            applicationId_noteTypeId: {
              applicationId: testApplicationId,
              noteTypeId: "PO and OGD",
            },
          },
        },
      ],
      [
        {
          where: {
            applicationId_noteTypeId: {
              applicationId: testApplicationId,
              noteTypeId: "OGC and OMB",
            },
          },
        },
      ],
    ];

    await deleteApplicationNotes(testInput, mockTransaction);
    expect(transactionMocks.applicationNote.delete.mock.calls).toEqual(expectedCalls);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { upsertApplicationNotes } from "../index.js";
import { ParsedSetApplicationNotesInput } from "../parseSetApplicationNotesInput.js";

describe("upsertApplicationNotes", () => {
  const transactionMocks = {
    applicationNote: {
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationNote: {
      upsert: transactionMocks.applicationNote.upsert,
    },
  } as any;
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testNoteContent1 = "Test Note Content 1";
  const testNoteContent2 = "Test Note Content 2";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should upsert changed notes", async () => {
    const testInput: ParsedSetApplicationNotesInput = {
      applicationId: testApplicationId,
      applicationNotesToUpsert: [
        {
          noteType: "PO and OGD",
          content: testNoteContent1,
        },
        {
          noteType: "OGC and OMB",
          content: testNoteContent2,
        },
      ],
      applicationNotesToDelete: [],
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
          update: {
            content: testNoteContent1,
          },
          create: {
            applicationId: testApplicationId,
            noteTypeId: "PO and OGD",
            content: testNoteContent1,
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
          update: {
            content: testNoteContent2,
          },
          create: {
            applicationId: testApplicationId,
            noteTypeId: "OGC and OMB",
            content: testNoteContent2,
          },
        },
      ],
    ];

    await upsertApplicationNotes(testInput, mockTransaction);
    expect(transactionMocks.applicationNote.upsert.mock.calls).toEqual(expectedCalls);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryApplicationNotesByNoteTypes } from "./queryApplicationNotesByNoteTypes.js";
import { NoteType } from "../../../types";

describe("queryApplicationNotesByNoteTypes", () => {
  const transactionMocks = {
    applicationNote: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationNote: {
      findMany: transactionMocks.applicationNote.findMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request notes for the application from the database by note types", async () => {
    const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
    const testNoteTypes: NoteType[] = ["PO and OGD", "CMS (OSORA) Clearance"];

    const expectedCall = {
      where: {
        applicationId: testApplicationId,
        noteTypeId: { in: testNoteTypes },
      },
      select: {
        noteTypeId: true,
        content: true,
      },
    };

    await queryApplicationNotesByNoteTypes(mockTransaction, testApplicationId, testNoteTypes);
    expect(transactionMocks.applicationNote.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

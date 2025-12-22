import { describe, it, expect } from "vitest";
import { mergeApplicationNotes } from "./mergeApplicationNotes.js";
import { ParsedApplicationNoteInput } from "./parseSetApplicationNotesInput.js";

describe("mergeApplicationDates", () => {
  const testExistingNotes: ParsedApplicationNoteInput[] = [
    {
      noteType: "PO and OGD",
      content: "Existing PO and OGD Note Content",
    },
    {
      noteType: "CMS (OSORA) Clearance",
      content: "Existing CMS (OSORA) Clearance Note Content",
    },
  ];
  const testNewNotes: ParsedApplicationNoteInput[] = [
    {
      noteType: "OGC and OMB",
      content: "New OGC and OMB Note Content",
    },
    {
      noteType: "PO and OGD",
      content: "New PO and OGD Note Content",
    },
  ];

  it("should merge the two lists correctly", () => {
    const expectedResult: ParsedApplicationNoteInput[] = [
      {
        noteType: "PO and OGD",
        content: "New PO and OGD Note Content",
      },
      {
        noteType: "CMS (OSORA) Clearance",
        content: "Existing CMS (OSORA) Clearance Note Content",
      },
      {
        noteType: "OGC and OMB",
        content: "New OGC and OMB Note Content",
      },
    ];
    const result = mergeApplicationNotes(testExistingNotes, testNewNotes, []);
    expect(result).toEqual(expect.arrayContaining(expectedResult));
    expect(result).toHaveLength(expectedResult.length);
  });

  it("should delete items that are requested to delete", () => {
    const expectedResult: ParsedApplicationNoteInput[] = [
      {
        noteType: "PO and OGD",
        content: "New PO and OGD Note Content",
      },
      {
        noteType: "OGC and OMB",
        content: "New OGC and OMB Note Content",
      },
    ];
    const result = mergeApplicationNotes(testExistingNotes, testNewNotes, [
      "CMS (OSORA) Clearance",
    ]);
    expect(result).toEqual(expect.arrayContaining(expectedResult));
    expect(result).toHaveLength(expectedResult.length);
  });
});

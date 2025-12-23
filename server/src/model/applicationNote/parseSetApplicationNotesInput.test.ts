import { describe, it, expect, vi } from "vitest";
import { parseSetApplicationNotesInput } from "./parseSetApplicationNotesInput.js";
import { SetApplicationNotesInput } from "./applicationNoteSchema.js";

describe("parseInputApplicationNotes", () => {
  const testApplicationId = "155e76dd-df48-47f6-a50f-b1300c29ca27";
  const testNoteContent1 = "Note Content 1";
  const testNoteContent2 = "Note Content 2";
  const testInputs: SetApplicationNotesInput = {
    applicationId: testApplicationId,
    applicationNotes: [
      {
        noteType: "PO and OGD",
        content: testNoteContent1,
      },
      {
        noteType: "OGC and OMB",
        content: testNoteContent2,
      },
      {
        noteType: "CMS (OSORA) Clearance",
        content: null,
      },
    ],
  };

  it("should add null items to the deletion list", () => {
    const result = parseSetApplicationNotesInput(testInputs);
    expect(result.applicationNotesToDelete).toEqual(["CMS (OSORA) Clearance"]);
  });

  it("should return non-null items in the upsert list", () => {
    const result = parseSetApplicationNotesInput(testInputs);
    expect(result.applicationNotesToUpsert).toEqual([
      {
        noteType: "PO and OGD",
        content: testNoteContent1,
      },
      {
        noteType: "OGC and OMB",
        content: testNoteContent2,
      },
    ]);
  });
});

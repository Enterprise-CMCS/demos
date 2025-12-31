import { describe, it, expect } from "vitest";
import { filterChangingNoteTypes } from "./filterChangingNoteTypes";
import { ApplicationNoteInput } from "./applicationNoteSchema";
import { ApplicationNote as PrismaApplicationNote } from "@prisma/client";
import { NoteType } from "../../types";

describe("filterChangingNoteTypes", () => {
  const testNoteType1: NoteType = "PO and OGD";
  const testNoteType2: NoteType = "OGC and OMB";
  const testNoteType3: NoteType = "CMS (OSORA) Clearance";

  describe("new notes (no existing note)", () => {
    it("should return note type for new note", () => {
      const inputApplicationNotes: ApplicationNoteInput[] = [
        { noteType: testNoteType1, content: "Test content" },
      ];
      const existingApplicationNotes: Pick<PrismaApplicationNote, "noteTypeId" | "content">[] = [];

      const result = filterChangingNoteTypes(inputApplicationNotes, existingApplicationNotes);

      expect(result).toEqual([testNoteType1]);
    });
  });

  describe("input note is null (deletion)", () => {
    it("should return note type when input is null with existing note", () => {
      const existingContent = "Test content";
      const inputApplicationNotes: ApplicationNoteInput[] = [
        { noteType: testNoteType1, content: null },
      ];
      const existingApplicationNotes: Pick<PrismaApplicationNote, "noteTypeId" | "content">[] = [
        {
          noteTypeId: testNoteType1,
          content: existingContent,
        },
      ];

      const result = filterChangingNoteTypes(inputApplicationNotes, existingApplicationNotes);

      expect(result).toEqual([testNoteType1]);
    });
  });

  describe("note comparison with values", () => {
    it("should NOT return note type when notes have same content", () => {
      const content = "Test content";
      const existingContent = content;

      const inputApplicationNotes: ApplicationNoteInput[] = [
        { noteType: testNoteType1, content: content },
      ];
      const existingApplicationNotes: Pick<PrismaApplicationNote, "noteTypeId" | "content">[] = [
        {
          noteTypeId: testNoteType1,
          content: existingContent,
        },
      ];

      const result = filterChangingNoteTypes(inputApplicationNotes, existingApplicationNotes);

      expect(result).toEqual([]);
    });

    it("should return note type when notes have different content", () => {
      const existingContent = "existing content";

      const inputApplicationNotes: ApplicationNoteInput[] = [
        { noteType: testNoteType1, content: "New content" },
      ];
      const existingApplicationNotes: Pick<PrismaApplicationNote, "noteTypeId" | "content">[] = [
        {
          noteTypeId: testNoteType1,
          content: existingContent,
        },
      ];

      const result = filterChangingNoteTypes(inputApplicationNotes, existingApplicationNotes);

      expect(result).toEqual([testNoteType1]);
    });
  });

  describe("multiple notes", () => {
    it("should only return note types that changed", () => {
      const unchangedNote = "unchanged content";
      const changedOldNote = "old content";

      const inputApplicationNotes: ApplicationNoteInput[] = [
        { noteType: testNoteType1, content: "unchanged content" }, // Unchanged
        { noteType: testNoteType2, content: "new content" }, // Changed
        { noteType: testNoteType3, content: "changed content" }, // New
      ];
      const existingApplicationNotes: Pick<PrismaApplicationNote, "noteTypeId" | "content">[] = [
        {
          noteTypeId: testNoteType1,
          content: unchangedNote,
        },
        {
          noteTypeId: testNoteType2,
          content: changedOldNote,
        },
      ];

      const result = filterChangingNoteTypes(inputApplicationNotes, existingApplicationNotes);

      expect(result).toEqual([testNoteType2, testNoteType3]);
    });

    it("should return all null input notes as changes", () => {
      const existingContent = "existing content";

      const inputApplicationNotes: ApplicationNoteInput[] = [
        { noteType: testNoteType1, content: null }, // Null with existing
        { noteType: testNoteType2, content: null }, // Null without existing
      ];
      const existingApplicationNotes: Pick<PrismaApplicationNote, "noteTypeId" | "content">[] = [
        {
          noteTypeId: testNoteType1,
          content: existingContent,
        },
      ];

      const result = filterChangingNoteTypes(inputApplicationNotes, existingApplicationNotes);

      expect(result).toEqual([testNoteType1, testNoteType2]);
    });
  });
});

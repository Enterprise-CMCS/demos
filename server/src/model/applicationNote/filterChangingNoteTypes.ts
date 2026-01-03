import { ApplicationNote as PrismaApplicationNote } from "@prisma/client";
import { ApplicationNoteInput } from "./applicationNoteSchema";
import { NoteType } from "../../types";

export const filterChangingNoteTypes = (
  inputApplicationNotes: ApplicationNoteInput[],
  existingApplicationNotes: Pick<PrismaApplicationNote, "noteTypeId" | "content">[]
): NoteType[] => {
  return inputApplicationNotes
    .filter((inputApplicationNote) => {
      const existingApplicationNote = existingApplicationNotes.find(
        (appNote) => appNote.noteTypeId === inputApplicationNote.noteType
      );

      // If there is no existing note, or the input content is null, it's a change
      // (cannot delete non-existing note)
      if (!existingApplicationNote || !inputApplicationNote.content) return true;

      return existingApplicationNote.content !== inputApplicationNote.content;
    })
    .map((note) => note.noteType);
};

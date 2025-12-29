import { NoteType } from "../../types.js";
import { ParsedApplicationNoteInput } from ".";

export function mergeApplicationNotes(
  existingNotes: ParsedApplicationNoteInput[],
  newNotes: ParsedApplicationNoteInput[],
  notesToDelete: NoteType[]
): ParsedApplicationNoteInput[] {
  const resultNoteMap = new Map(
    existingNotes.map((existingNote) => [existingNote.noteType, existingNote])
  );
  newNotes.forEach((newNote) => resultNoteMap.set(newNote.noteType, newNote));
  notesToDelete.forEach((noteType) => resultNoteMap.delete(noteType));
  return Array.from(resultNoteMap.values());
}

import { ApplicationNoteInput, NoteType } from "../../types.js";

export function mergeApplicationNotes(
  existingNotes: ApplicationNoteInput[],
  newNotes: ApplicationNoteInput[],
  notesToDelete: NoteType[]
): ApplicationNoteInput[] {
  const resultNoteMap = new Map(
    existingNotes.map((existingNote) => [existingNote.noteType, existingNote])
  );
  newNotes.forEach((newNote) => resultNoteMap.set(newNote.noteType, newNote));
  notesToDelete.forEach((noteType) => resultNoteMap.delete(noteType));
  return Array.from(resultNoteMap.values());
}

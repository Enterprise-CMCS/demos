import { NoteType } from "../../types";
import { SetApplicationNotesInput } from "./applicationNoteSchema";

export type ParsedApplicationNoteInput = {
  noteType: NoteType;
  content: string;
};

export interface ParsedSetApplicationNotesInput {
  applicationId: string;
  applicationNotesToUpsert: ParsedApplicationNoteInput[];
  applicationNotesToDelete: NoteType[];
}

export function parseSetApplicationNotesInput(
  inputApplicationNotes: SetApplicationNotesInput
): ParsedSetApplicationNotesInput {
  const result: ParsedSetApplicationNotesInput = {
    applicationId: inputApplicationNotes.applicationId,
    applicationNotesToUpsert: [],
    applicationNotesToDelete: [],
  };
  for (const applicationNote of inputApplicationNotes.applicationNotes) {
    if (applicationNote.content === null) {
      result.applicationNotesToDelete.push(applicationNote.noteType);
    } else {
      result.applicationNotesToUpsert.push({
        noteType: applicationNote.noteType,
        content: applicationNote.content,
      });
    }
  }
  return result;
}

import { NoteType } from "../../types";
import { ApplicationNoteInput, SetApplicationNotesInput } from "./applicationNoteSchema";

export interface ParsedSetApplicationNotesInput {
  applicationId: string;
  applicationNotesToUpsert: ApplicationNoteInput[];
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

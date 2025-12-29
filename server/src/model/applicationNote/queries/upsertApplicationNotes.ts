import { PrismaTransactionClient } from "../../../prismaClient";
import { ParsedSetApplicationNotesInput } from "../";

export async function upsertApplicationNotes(
  parsedInputApplicationNotes: ParsedSetApplicationNotesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const noteUpdateOperations = parsedInputApplicationNotes.applicationNotesToUpsert.map(
    (noteToUpdate) => {
      return tx.applicationNote.upsert({
        where: {
          applicationId_noteTypeId: {
            applicationId: parsedInputApplicationNotes.applicationId,
            noteTypeId: noteToUpdate.noteType,
          },
        },
        update: {
          content: noteToUpdate.content,
        },
        create: {
          applicationId: parsedInputApplicationNotes.applicationId,
          noteTypeId: noteToUpdate.noteType,
          content: noteToUpdate.content,
        },
      });
    }
  );
  await Promise.all(noteUpdateOperations);
}

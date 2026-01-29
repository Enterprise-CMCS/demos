import { PrismaTransactionClient } from "../../../prismaClient";
import { ParsedSetApplicationNotesInput } from "../";

export async function upsertApplicationNotes(
  parsedInputApplicationNotes: ParsedSetApplicationNotesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  for (const noteToUpdate of parsedInputApplicationNotes.applicationNotesToUpsert) {
    await tx.applicationNote.upsert({
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
}

import { PrismaTransactionClient } from "../../../prismaClient";
import { ParsedSetApplicationNotesInput } from "../";

export async function deleteApplicationNotes(
  parsedInputApplicationNotes: ParsedSetApplicationNotesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  for (const noteToDelete of parsedInputApplicationNotes.applicationNotesToDelete) {
    await tx.applicationNote.delete({
      where: {
        applicationId_noteTypeId: {
          applicationId: parsedInputApplicationNotes.applicationId,
          noteTypeId: noteToDelete,
        },
      },
    });
  }
}

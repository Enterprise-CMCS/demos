import { PrismaTransactionClient } from "../../../prismaClient";
import { ParsedSetApplicationNotesInput } from "../";

export async function deleteApplicationNotes(
  parsedInputApplicationNotes: ParsedSetApplicationNotesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const noteDeleteOperations = parsedInputApplicationNotes.applicationNotesToDelete.map(
    (noteToUpdate) => {
      return tx.applicationNote.delete({
        where: {
          applicationId_noteTypeId: {
            applicationId: parsedInputApplicationNotes.applicationId,
            noteTypeId: noteToUpdate,
          },
        },
      });
    }
  );
  await Promise.all(noteDeleteOperations);
}

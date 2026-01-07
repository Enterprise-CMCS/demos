import { PrismaTransactionClient } from "../../prismaClient";
import { SetApplicationNotesInput } from "../../types";

export async function validateAllowedNoteChangeByPhase(
  tx: PrismaTransactionClient,
  input: SetApplicationNotesInput
): Promise<void> {
  const completedPhases = await tx.applicationPhase.findMany({
    where: {
      applicationId: input.applicationId,
      phaseStatusId: "Completed",
    },
  });

  if (disallowedNotes.length > 0) {
    const errors = disallowedNotes
      .map((disallowedNote) => `${disallowedNote.noteType} note on ${disallowedNote.phaseId} phase`)
      .join(", ");
    throw new Error(
      `Cannot modify notes because they are associated with finished phases: ${errors}.`
    );
  }
}

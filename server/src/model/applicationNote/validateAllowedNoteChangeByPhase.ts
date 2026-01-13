import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus, SetApplicationNotesInput } from "../../types";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";
import { getPhaseNoteTypes, PhaseNoteType } from "../phaseNoteType";
export async function validateAllowedNoteChangeByPhase(
  tx: PrismaTransactionClient,
  input: SetApplicationNotesInput
): Promise<void> {
  const completedPhaseIds: PhaseNameWithTrackedStatus[] = await getFinishedApplicationPhaseIds(
    tx,
    input.applicationId
  );
  const disallowedNoteInputs: PhaseNoteType[] = await getPhaseNoteTypes(
    tx,
    completedPhaseIds,
    input.applicationNotes.map((applicationNote) => applicationNote.noteType)
  );

  if (disallowedNoteInputs.length > 0) {
    const errorMessages = disallowedNoteInputs.map(
      (disallowedNoteInput) =>
        `${disallowedNoteInput.noteTypeId} note on ${disallowedNoteInput.phaseId} phase`
    );
    throw new Error(
      `Cannot modify notes because they are associated with finished phases: ${errorMessages.join(", ")}.`
    );
  }
}

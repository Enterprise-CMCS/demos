import { PrismaTransactionClient } from "../../prismaClient";
import { SetApplicationNotesInput } from "../../types";
import { filterChangingNoteTypes } from "./filterChangingNoteTypes";
import { queryApplicationNotesByNoteTypes } from "./queries/queryApplicationNotesByNoteTypes";
import { queryApplicationNoteTypesOnFinishedPhases } from "./queries/queryApplicationNoteTypesOnFinishedPhases";

export async function validateAllowedNoteChangeByPhase(
  tx: PrismaTransactionClient,
  input: SetApplicationNotesInput
): Promise<void> {
  const existingApplicationNotes = await queryApplicationNotesByNoteTypes(
    tx,
    input.applicationId,
    input.applicationNotes.map((note) => note.noteType)
  );

  const noteTypesToBeChanged = filterChangingNoteTypes(
    input.applicationNotes,
    existingApplicationNotes
  );

  const restrictedPhaseNoteTypeChanges = await queryApplicationNoteTypesOnFinishedPhases(
    tx,
    input.applicationId,
    noteTypesToBeChanged
  );

  if (restrictedPhaseNoteTypeChanges.length > 0) {
    const errors = restrictedPhaseNoteTypeChanges
      .map((note) => `${note.noteTypeId} note on ${note.phaseId} phase`)
      .join(", ");
    throw new Error(
      `Cannot modify notes because they are associated with finished phases: ${errors}.`
    );
  }
}

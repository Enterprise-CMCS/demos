import { PrismaTransactionClient } from "../../prismaClient";
import { NoteType, PhaseStatus } from "../../types";
import { SetApplicationNotesInput } from "./applicationNoteSchema";

export async function checkForNoteChangesOnCompletedPhase(
  tx: PrismaTransactionClient,
  input: SetApplicationNotesInput
): Promise<void> {
  const existingApplicationNotes = await tx.applicationNote.findMany({
    where: {
      applicationId: input.applicationId,
      noteTypeId: { in: input.applicationNotes.map((note) => note.noteType) },
    },
    select: {
      noteTypeId: true,
      content: true,
    },
  });

  const noteTypesToBeChanged: NoteType[] = input.applicationNotes
    .filter((inputNote) => {
      const existingNote = existingApplicationNotes.find(
        (appNote) => appNote.noteTypeId === inputNote.noteType
      );
      if (!existingNote) return true;
      return existingNote.content !== inputNote.content;
    })
    .map((note) => note.noteType);

  const noteChangesOnCompletedPhases = await tx.phaseNoteType.findMany({
    where: {
      noteTypeId: { in: noteTypesToBeChanged },
      phase: {
        applicationPhaseTypeLimit: {
          some: {
            applicationPhases: {
              some: {
                applicationId: input.applicationId,
                phaseStatusId: "Completed" satisfies PhaseStatus,
              },
            },
          },
        },
      },
    },
    select: {
      noteTypeId: true,
      phaseId: true,
    },
  });

  if (noteChangesOnCompletedPhases.length > 0) {
    const errors = noteChangesOnCompletedPhases
      .map((note) => `${note.noteTypeId} note on ${note.phaseId} phase`)
      .join(", ");
    throw new Error(
      `Cannot modify notes because they are associated with completed phases: ${errors}.`
    );
  }
}

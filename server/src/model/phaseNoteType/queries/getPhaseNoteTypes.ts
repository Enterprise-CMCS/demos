import { PrismaTransactionClient } from "../../../prismaClient";
import { NoteType, PhaseName } from "../../../types";

export type PhaseNoteType = {
  phaseId: PhaseName;
  noteTypeId: NoteType;
};

export const getPhaseNoteTypes = async (
  tx: PrismaTransactionClient,
  phaseIds: PhaseName[],
  noteTypes: NoteType[]
): Promise<PhaseNoteType[]> => {
  return (await tx.phaseNoteType.findMany({
    where: {
      phaseId: { in: phaseIds },
      noteTypeId: { in: noteTypes },
    },
    select: {
      phaseId: true,
      noteTypeId: true,
    },
    // casting enforced by database constraints
  })) as PhaseNoteType[];
};

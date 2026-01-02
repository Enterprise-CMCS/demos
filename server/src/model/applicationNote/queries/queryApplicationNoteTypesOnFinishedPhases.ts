import { PhaseNoteType as PrismaPhaseNoteType } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { NoteType, PhaseStatus } from "../../../types";

const COMPLETED_STATUS: PhaseStatus = "Completed";
const SKIPPED_STATUS: PhaseStatus = "Skipped";

export const queryApplicationNoteTypesOnFinishedPhases = async (
  tx: PrismaTransactionClient,
  applicationId: string,
  noteTypes: NoteType[]
): Promise<PrismaPhaseNoteType[]> => {
  return await tx.phaseNoteType.findMany({
    where: {
      noteTypeId: { in: noteTypes },
      phase: {
        applicationPhaseTypeLimit: {
          some: {
            applicationPhases: {
              some: {
                applicationId: applicationId,
                phaseStatusId: {
                  in: [COMPLETED_STATUS, SKIPPED_STATUS],
                },
              },
            },
          },
        },
      },
    },
    select: {
      phaseId: true,
      noteTypeId: true,
    },
  });
};

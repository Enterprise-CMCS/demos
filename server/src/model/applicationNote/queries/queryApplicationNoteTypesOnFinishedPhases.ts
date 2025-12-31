import { PhaseNoteType as PrismaPhaseNoteType } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { NoteType, PhaseStatus } from "../../../types";

const COMPLETED_STATUS: PhaseStatus = "Completed";
const SKIPPED_STATUS: PhaseStatus = "Skipped";
const CONCEPT_PHASE_ID = "Concept";

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
                OR: [
                  {
                    phaseId: CONCEPT_PHASE_ID,
                    phaseStatusId: {
                      in: [COMPLETED_STATUS, SKIPPED_STATUS],
                    },
                  },
                  {
                    phaseId: { not: CONCEPT_PHASE_ID },
                    phaseStatusId: COMPLETED_STATUS,
                  },
                ],
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

import { PhaseDateType as PrismaPhaseDateType } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { DateType, PhaseStatus } from "../../../types";

const COMPLETED_STATUS: PhaseStatus = "Completed";
const SKIPPED_STATUS: PhaseStatus = "Skipped";
const CONCEPT_PHASE_ID = "Concept";

export const queryApplicationDateTypesOnFinishedPhases = async (
  tx: PrismaTransactionClient,
  applicationId: string,
  dateTypes: DateType[]
): Promise<PrismaPhaseDateType[]> => {
  return await tx.phaseDateType.findMany({
    where: {
      dateTypeId: { in: dateTypes },
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
      dateTypeId: true,
    },
  });
};

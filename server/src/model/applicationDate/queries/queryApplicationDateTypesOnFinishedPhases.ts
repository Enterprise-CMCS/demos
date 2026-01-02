import { PhaseDateType as PrismaPhaseDateType } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { DateType, PhaseStatus } from "../../../types";

const COMPLETED_STATUS: PhaseStatus = "Completed";
const SKIPPED_STATUS: PhaseStatus = "Skipped";

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
      dateTypeId: true,
    },
  });
};

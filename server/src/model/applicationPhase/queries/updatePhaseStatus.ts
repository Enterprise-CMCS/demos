import { PrismaTransactionClient } from "../../../prismaClient.js";
import { PhaseNameWithTrackedStatus, PhaseStatus } from "../../../types.js";

export async function updatePhaseStatus(
  applicationId: string,
  phaseName: PhaseNameWithTrackedStatus,
  phaseStatus: PhaseStatus,
  tx: PrismaTransactionClient
): Promise<void> {
  await tx.applicationPhase.update({
    where: {
      applicationId_phaseId: {
        applicationId: applicationId,
        phaseId: phaseName,
      },
    },
    data: {
      phaseStatusId: phaseStatus,
    },
  });
}

import { PrismaTransactionClient } from "../../../prismaClient.js";
import { PhaseNameWithTrackedStatus, PhaseStatus } from "../../../types.js";

export async function getApplicationPhaseStatus(
  applicationId: string,
  phaseName: PhaseNameWithTrackedStatus,
  tx: PrismaTransactionClient
): Promise<PhaseStatus> {
  const results = await tx.applicationPhase.findUnique({
    select: {
      phaseStatusId: true,
    },
    where: {
      applicationId_phaseId: {
        applicationId: applicationId,
        phaseId: phaseName,
      },
    },
  });
  // Guaranteed to return by DB, type guaranteed by DB
  return results!.phaseStatusId as PhaseStatus;
}

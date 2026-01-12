import { PrismaTransactionClient } from "../../../prismaClient";
import { PhaseNameWithTrackedStatus, PhaseStatus } from "../../../types";

const COMPLETED_PHASE_STATUS_ID: PhaseStatus = "Completed";
const SKIPPED_PHASE_STATUS_ID: PhaseStatus = "Skipped";

export const getFinishedApplicationPhaseIds = async (
  tx: PrismaTransactionClient,
  applicationId: string
): Promise<PhaseNameWithTrackedStatus[]> => {
  return (
    (
      await tx.applicationPhase.findMany({
        where: {
          applicationId: applicationId,
          phaseStatusId: { in: [COMPLETED_PHASE_STATUS_ID, SKIPPED_PHASE_STATUS_ID] },
        },
        select: {
          phaseId: true,
        },
      })
    )
      // casting enforced by database constraints
      .map((phase) => phase.phaseId) as PhaseNameWithTrackedStatus[]
  );
};

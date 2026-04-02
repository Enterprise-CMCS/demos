import { PrismaTransactionClient } from "../../../prismaClient";
import { PhaseName, PhaseStatus } from "../../../types";

const COMPLETED_PHASE_STATUS_ID: PhaseStatus = "Completed";
const SKIPPED_PHASE_STATUS_ID: PhaseStatus = "Skipped";

export const getFinishedApplicationPhaseIds = async (
  tx: PrismaTransactionClient,
  applicationId: string
): Promise<PhaseName[]> => {
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
      .map((phase) => phase.phaseId) as PhaseName[]
  );
};

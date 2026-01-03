import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus, PhaseStatus } from "../../types";
import { getApplicationPhaseStatus } from "../applicationPhase";

const REVIEW_PHASE_NAME: PhaseNameWithTrackedStatus = "Review";
const COMPLETED_STATUS: PhaseStatus = "Completed";

export async function checkReviewPhaseNotCompleted(
  tx: PrismaTransactionClient,
  applicationId: string
): Promise<void> {
  const reviewPhaseStatus = await getApplicationPhaseStatus(applicationId, REVIEW_PHASE_NAME, tx);

  if (reviewPhaseStatus === COMPLETED_STATUS) {
    throw new Error(
      "Cannot change the clearance level of an application whose Review phase is completed."
    );
  }
}

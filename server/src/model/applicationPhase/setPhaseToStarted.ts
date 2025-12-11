import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus } from "../../types.js";
import { getApplicationPhaseStatus, updatePhaseStatus } from ".";

export async function setPhaseToStarted(
  applicationId: string,
  phaseName: PhaseNameWithTrackedStatus,
  tx: PrismaTransactionClient
): Promise<boolean> {
  const phaseStatus = await getApplicationPhaseStatus(applicationId, phaseName, tx);
  if (
    phaseStatus === "Not Started" ||
    (phaseName === "Completeness" && phaseStatus === "Incomplete") // Special case for Completeness phase
  ) {
    await updatePhaseStatus(applicationId, phaseName, "Started", tx);
    return true;
  }
  return false;
}

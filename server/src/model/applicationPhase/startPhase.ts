import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus } from "../../types.js";
import { getApplicationPhaseStatus, updatePhaseStatus } from ".";

export async function startPhase(
  applicationId: string,
  phaseName: PhaseNameWithTrackedStatus,
  tx: PrismaTransactionClient
): Promise<boolean> {
  const phaseStatus = await getApplicationPhaseStatus(applicationId, phaseName, tx);
  if (phaseStatus === "Not Started") {
    await updatePhaseStatus(applicationId, phaseName, "Started", tx);
    return true;
  }
  return false;
}

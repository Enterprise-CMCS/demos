import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus } from "../../types.js";
import { getApplicationPhaseStatus, updatePhaseStatus } from ".";

export async function startPhase(
  applicationId: string,
  phaseName: PhaseNameWithTrackedStatus,
  tx: PrismaTransactionClient
): Promise<boolean> {
  const nextPhaseStatus = await getApplicationPhaseStatus(applicationId, phaseName, tx);
  if (nextPhaseStatus === "Not Started") {
    await updatePhaseStatus(applicationId, phaseName, "Started", tx);
    return true;
  }
  return false;
}

import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus } from "../../types.js";
import { getApplicationPhaseStatus, updatePhaseStatus } from ".";

export async function startNextPhase(
  applicationId: string,
  nextPhaseName: PhaseNameWithTrackedStatus,
  tx: PrismaTransactionClient
): Promise<void> {
  const nextPhaseStatus = await getApplicationPhaseStatus(applicationId, nextPhaseName, tx);
  if (nextPhaseStatus === "Not Started") {
    await updatePhaseStatus(applicationId, nextPhaseName, "Started", tx);
  }
}

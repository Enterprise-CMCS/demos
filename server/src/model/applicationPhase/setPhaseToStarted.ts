import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseName } from "../../types.js";
import { getApplicationPhaseStatus, updatePhaseStatus } from ".";

export async function setPhaseToStarted(
  applicationId: string,
  phaseName: PhaseName,
  tx: PrismaTransactionClient
): Promise<boolean> {
  // The federal comment period is only started or finished based on the date
  // This is handled entirely in the DB; therefore, can just skip processing
  if (phaseName === "Federal Comment") {
    return false;
  }
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

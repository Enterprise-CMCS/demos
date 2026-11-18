import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseName } from "../../types.js";
import { getApplicationPhaseStatus, updatePhaseStatus } from "./index.js";
import { PHASE_ACTION_TYPE_MAPPING } from "./applicationPhaseConstants.js";
import { insertApplicationAction } from "../applicationAction/queries";

export async function setPhaseToStarted(
  applicationId: string,
  phaseName: PhaseName,
  userId: string,
  tx: PrismaTransactionClient
): Promise<boolean> {

  if (phaseName === "Federal Comment" || phaseName === "Concept") {
    return false;
  }
  phaseName = phaseName as Exclude<typeof phaseName, "Federal Comment" | "Concept">;

  const phaseStatus = await getApplicationPhaseStatus(applicationId, phaseName, tx);
  if (
    phaseStatus === "Not Started" ||
    (phaseName === "Completeness" && phaseStatus === "Incomplete") // Special case for Completeness phase
  ) {
    await updatePhaseStatus(applicationId, phaseName, "Started", tx);

    await insertApplicationAction(
      {
        applicationId,
        actionType: PHASE_ACTION_TYPE_MAPPING[phaseName].start,
        userId,
      },
      tx
    );

    return true;
  }
  return false;
}

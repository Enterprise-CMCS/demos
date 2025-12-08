import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseName } from "../../types";
import { ApplicationDateInput } from "../applicationDate/applicationDateSchema";
import { startPhase } from ".";
import { createPhaseStartDate } from "../applicationDate/createPhaseStartDate";
import { EasternNow } from "../../dateUtilities";

export async function startPhaseByPhaseName(
  tx: PrismaTransactionClient,
  applicationId: string,
  phaseName: PhaseName,
  easternNow: EasternNow
): Promise<ApplicationDateInput | null> {
  if (phaseName === "None") {
    return null;
  }
  const phaseStarted = await startPhase(applicationId, phaseName, tx);
  if (phaseStarted) {
    const startDateForPhase = createPhaseStartDate(phaseName, easternNow);
    if (startDateForPhase) {
      return startDateForPhase;
    }
  }
  return null;
}

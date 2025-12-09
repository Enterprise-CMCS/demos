import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseName, ApplicationDateInput } from "../../types";
import { EasternNow } from "../../dateUtilities";
import { createPhaseStartDate } from "../applicationDate";
import { startPhase } from ".";

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

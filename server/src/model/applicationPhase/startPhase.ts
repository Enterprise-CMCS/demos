import { PrismaTransactionClient } from "../../prismaClient";
import { ApplicationDateInput, PhaseName } from "../../types";
import { EasternNow } from "../../dateUtilities";
import { createPhaseStartDate } from "../applicationDate";
import { setPhaseToStarted } from ".";

export async function startPhase(
  tx: PrismaTransactionClient,
  applicationId: string,
  phaseName: PhaseName,
  easternNow: EasternNow
): Promise<ApplicationDateInput | null> {
  const phaseStarted = await setPhaseToStarted(applicationId, phaseName, tx);
  if (phaseStarted) {
    const startDateForPhase = createPhaseStartDate(phaseName, easternNow);
    if (startDateForPhase) {
      return startDateForPhase;
    }
  }
  return null;
}

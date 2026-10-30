import { PrismaTransactionClient } from "../../prismaClient";
import { ApplicationDateInput, PhaseName } from "../../types";
import { createPhaseStartDate } from "../applicationDate";
import { setPhaseToStarted } from ".";

export async function startPhase(
  tx: PrismaTransactionClient,
  applicationId: string,
  phaseName: PhaseName,
  easternToday: string
): Promise<ApplicationDateInput | null> {
  const phaseStarted = await setPhaseToStarted(applicationId, phaseName, tx);
  if (phaseStarted) {
    const startDateForPhase = createPhaseStartDate(phaseName, easternToday);
    if (startDateForPhase) {
      return startDateForPhase;
    }
  }
  return null;
}

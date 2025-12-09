import { PrismaTransactionClient } from "../../prismaClient";
import { ApplicationDateInput, UploadDocumentInput } from "../../types";
import { EasternNow } from "../../dateUtilities";
import { createPhaseStartDate } from "../applicationDate";
import { setPhaseToStarted } from ".";

export async function startPhaseByDocument(
  tx: PrismaTransactionClient,
  applicationId: string,
  document: Pick<UploadDocumentInput, "phaseName">,
  easternNow: EasternNow
): Promise<ApplicationDateInput | null> {
  if (document.phaseName === "None") {
    return null;
  }
  const phaseStarted = await setPhaseToStarted(applicationId, document.phaseName, tx);
  if (phaseStarted) {
    const startDateForPhase = createPhaseStartDate(document.phaseName, easternNow);
    if (startDateForPhase) {
      return startDateForPhase;
    }
  }
  return null;
}

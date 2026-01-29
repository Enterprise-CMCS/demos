import { PrismaTransactionClient } from "../../prismaClient";
import { ApplicationDateInput, UploadDocumentInput } from "../../types";
import { EasternNow } from "../../dateUtilities";
import { createPhaseStartDate } from "../applicationDate";
import { updateApplicationStatusToUnderReviewIfNeeded } from "../application";
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
    // Update application status to "Under Review" if starting Application Intake phase
    if (document.phaseName === "Application Intake") {
      await updateApplicationStatusToUnderReviewIfNeeded(applicationId, tx);
    }

    const startDateForPhase = createPhaseStartDate(document.phaseName, easternNow);
    if (startDateForPhase) {
      return startDateForPhase;
    }
  }
  return null;
}

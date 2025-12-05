import { PrismaTransactionClient } from "../../prismaClient";
import { DocumentType, PhaseNameWithTrackedStatus } from "../../types";
import { ApplicationDateInput } from "../applicationDate/applicationDateSchema";
import { startPhase } from "../applicationPhase";
import { createPhaseStartDate } from "../applicationDate/createPhaseStartDate";
import { EasternNow } from "../../dateUtilities";
import { getPhasesByDocumentType } from "../phaseDocumentType/queries/getPhasesByDocumentType";

export async function startPhaseByDocument(
  tx: PrismaTransactionClient,
  applicationId: string,
  documentType: DocumentType,
  easternNow: EasternNow
): Promise<ApplicationDateInput | null> {
  const phases = await getPhasesByDocumentType(tx, documentType);

  if (phases.length !== 1) {
    throw new Error(
      `Document type ${documentType} is associated with ${phases.length} phases, expected exactly 1 phase.`
    );
  }

  const phaseId = phases[0].id as PhaseNameWithTrackedStatus;
  const phaseStarted = await startPhase(applicationId, phaseId, tx);
  if (phaseStarted) {
    const startDateForPhase = createPhaseStartDate(phaseId, easternNow);
    if (startDateForPhase) {
      return startDateForPhase;
    }
  }
  return null;
}

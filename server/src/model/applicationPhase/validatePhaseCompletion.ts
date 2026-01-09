import {
  getApplicationPhaseDocumentTypes,
  getApplicationPhaseStatuses,
  checkPhaseCompletionRules,
} from ".";
import { PrismaTransactionClient } from "../../prismaClient.js";
import { PhaseNameWithTrackedStatus } from "../../types.js";
import { getApplicationDates } from "../applicationDate";

export async function validatePhaseCompletion(
  applicationId: string,
  phaseName: PhaseNameWithTrackedStatus,
  tx: PrismaTransactionClient
): Promise<void> {
  const applicationDates = await getApplicationDates(applicationId, tx);
  const applicationPhaseDocumentTypes = await getApplicationPhaseDocumentTypes(applicationId, tx);
  const applicationPhaseStatuses = await getApplicationPhaseStatuses(applicationId, tx);
  checkPhaseCompletionRules(
    applicationId,
    phaseName,
    applicationDates,
    applicationPhaseDocumentTypes,
    applicationPhaseStatuses
  );
}

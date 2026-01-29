import {
  getApplicationPhaseDocumentTypes,
  getApplicationPhaseStatuses,
  checkPhaseCompletionRules,
} from ".";
import { PrismaTransactionClient } from "../../prismaClient.js";
import { ClearanceLevel, PhaseNameWithTrackedStatus } from "../../types.js";
import { getApplication } from "../application";
import { getApplicationDates } from "../applicationDate";

export async function validatePhaseCompletion(
  applicationId: string,
  phaseName: PhaseNameWithTrackedStatus,
  tx: PrismaTransactionClient
): Promise<void> {
  const applicationDates = await getApplicationDates(applicationId, tx);
  const applicationPhaseDocumentTypes = await getApplicationPhaseDocumentTypes(applicationId, tx);
  const applicationPhaseStatuses = await getApplicationPhaseStatuses(applicationId, tx);
  // casting enforced by database schema
  const applicationClearanceLevel = (await (
    await getApplication(applicationId)
  ).clearanceLevelId) as ClearanceLevel;

  checkPhaseCompletionRules(
    applicationId,
    phaseName,
    applicationDates,
    applicationPhaseDocumentTypes,
    applicationPhaseStatuses,
    applicationClearanceLevel
  );
}

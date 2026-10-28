import { PrismaTransactionClient } from "../../prismaClient";
import { SetApplicationDatesInput } from "../../types";

import {
  deleteApplicationDates,
  getApplicationDates,
  mergeApplicationDates,
  parseSetApplicationDatesInput,
  upsertApplicationDates,
  validateInputDates,
  validateAllowedDateChangeByPhase,
  validateAllowedDateChangeForApplication,
  validateAllowedToChangeFederalCommentPeriodDates,
} from ".";
import { SemVer } from "semver";
import { getFeatureFlags } from "../../flags";

export async function validateAndUpdateDates(
  setApplicationDateInput: SetApplicationDatesInput,
  tx: PrismaTransactionClient,
  currentVersion: SemVer
): Promise<void> {
  await validateAllowedDateChangeForApplication(tx, setApplicationDateInput);
  await validateAllowedDateChangeByPhase(tx, setApplicationDateInput);
  const parsedSetApplicationDatesInput = parseSetApplicationDatesInput(setApplicationDateInput);
  const existingApplicationDates = await getApplicationDates(
    setApplicationDateInput.applicationId,
    tx
  );
  if (getFeatureFlags(currentVersion).blockChangingFederalCommentPeriodAfterSet) {
    validateAllowedToChangeFederalCommentPeriodDates(
      existingApplicationDates,
      parsedSetApplicationDatesInput
    );
  }
  const updatedApplicationDates = mergeApplicationDates(
    existingApplicationDates,
    parsedSetApplicationDatesInput.applicationDatesToUpsert,
    parsedSetApplicationDatesInput.applicationDatesToDelete
  );
  validateInputDates(updatedApplicationDates, currentVersion);
  await upsertApplicationDates(parsedSetApplicationDatesInput, tx);
  await deleteApplicationDates(parsedSetApplicationDatesInput, tx);
}

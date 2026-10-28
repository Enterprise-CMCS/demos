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

// This bypass supports the case of needing to declare an application incomplete
// This requires deleting existing federal comment period dates
type ValidateAndUpdateDatesOptions = {
  allowChangingExistingFederalCommentDates?: boolean;
};

export async function validateAndUpdateDates(
  setApplicationDateInput: SetApplicationDatesInput,
  tx: PrismaTransactionClient,
  currentVersion: SemVer,
  options: ValidateAndUpdateDatesOptions = {}
): Promise<void> {
  await validateAllowedDateChangeForApplication(tx, setApplicationDateInput);
  await validateAllowedDateChangeByPhase(tx, setApplicationDateInput);
  const parsedSetApplicationDatesInput = parseSetApplicationDatesInput(setApplicationDateInput);
  const existingApplicationDates = await getApplicationDates(
    setApplicationDateInput.applicationId,
    tx
  );
  if (
    getFeatureFlags(currentVersion).blockChangingFederalCommentPeriodAfterSet &&
    !options.allowChangingExistingFederalCommentDates
  ) {
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

import { PrismaTransactionClient } from "../../prismaClient.js";
import { SetApplicationDatesInput } from "../../types.js";

import {
  deleteApplicationDates,
  getApplicationDates,
  mergeApplicationDates,
  parseSetApplicationDatesInput,
  upsertApplicationDates,
  validateInputDates,
} from ".";
import { validateAllowedDateChangeByPhase } from "./validateAllowedDateChangeByPhase";

export async function validateAndUpdateDates(
  setApplicationDateInput: SetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  await validateAllowedDateChangeByPhase(tx, setApplicationDateInput);
  const parsedSetApplicationDatesInput = parseSetApplicationDatesInput(setApplicationDateInput);
  const existingApplicationDates = await getApplicationDates(
    setApplicationDateInput.applicationId,
    tx
  );
  const updatedApplicationDates = mergeApplicationDates(
    existingApplicationDates,
    parsedSetApplicationDatesInput.applicationDatesToUpsert,
    parsedSetApplicationDatesInput.applicationDatesToDelete
  );
  validateInputDates(updatedApplicationDates);
  await upsertApplicationDates(parsedSetApplicationDatesInput, tx);
  await deleteApplicationDates(parsedSetApplicationDatesInput, tx);
}

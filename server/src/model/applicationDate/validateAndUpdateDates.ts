import { PrismaTransactionClient } from "../../prismaClient.js";
import { SetApplicationDatesInput } from "../../types.js";

import {
  getApplicationDates,
  mergeApplicationDates,
  parseSetApplicationDatesInput,
  upsertApplicationDates,
  validateInputDates,
} from "./index.js";

export async function validateAndUpdateDates(
  setApplicationDateInput: SetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const parsedSetApplicationDatesInput = parseSetApplicationDatesInput(setApplicationDateInput);
  const existingApplicationDates = await getApplicationDates(
    setApplicationDateInput.applicationId,
    tx
  );
  const updatedApplicationDates = mergeApplicationDates(
    existingApplicationDates,
    parsedSetApplicationDatesInput.applicationDates
  );
  validateInputDates(updatedApplicationDates);
  await upsertApplicationDates(parsedSetApplicationDatesInput, tx);
}

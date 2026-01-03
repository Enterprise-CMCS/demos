import { PrismaTransactionClient } from "../../prismaClient";
import { SetApplicationDatesInput } from "../../types";
import { filterChangingDateTypes } from "./filterChangingDateTypes";
import { queryApplicationDatesByDateTypes } from "./queries/queryApplicationDatesByDateTypes";
import { queryApplicationDateTypesOnFinishedPhases } from "./queries/queryApplicationDateTypesOnFinishedPhases";

export async function validateAllowedDateChangeByPhase(
  tx: PrismaTransactionClient,
  input: SetApplicationDatesInput
): Promise<void> {
  const existingApplicationDates = await queryApplicationDatesByDateTypes(
    tx,
    input.applicationId,
    input.applicationDates.map((date) => date.dateType)
  );

  const dateTypesToBeChanged = filterChangingDateTypes(
    input.applicationDates,
    existingApplicationDates
  );

  const restrictedPhaseDateTypeChanges = await queryApplicationDateTypesOnFinishedPhases(
    tx,
    input.applicationId,
    dateTypesToBeChanged
  );

  if (restrictedPhaseDateTypeChanges.length > 0) {
    const errors = restrictedPhaseDateTypeChanges
      .map((date) => `${date.dateTypeId} date on ${date.phaseId} phase`)
      .join(", ");
    throw new Error(
      `Cannot modify dates because they are associated with finished phases: ${errors}.`
    );
  }
}

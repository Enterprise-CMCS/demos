import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus, SetApplicationDatesInput } from "../../types";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";
import { getPhaseDateTypesByIds, PhaseDateType } from "../phaseDateType";
export async function validateAllowedDateChangeByPhase(
  tx: PrismaTransactionClient,
  input: SetApplicationDatesInput
): Promise<void> {
  const completedPhaseIds: PhaseNameWithTrackedStatus[] = await getFinishedApplicationPhaseIds(
    tx,
    input.applicationId
  );
  const disallowedDateInputs: PhaseDateType[] = await getPhaseDateTypesByIds(
    tx,
    completedPhaseIds,
    input.applicationDates.map((applicationDate) => applicationDate.dateType)
  );

  if (disallowedDateInputs.length > 0) {
    const errorMessages = disallowedDateInputs.map(
      (disallowedDateInput) =>
        `${disallowedDateInput.dateTypeId} date on ${disallowedDateInput.phaseId} phase`
    );
    throw new Error(
      `Cannot modify dates because they are associated with finished phases: ${errorMessages.join(", ")}.`
    );
  }
}

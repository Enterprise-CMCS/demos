import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus } from "../../types";
import { ApplicationDateInput, SetApplicationDatesInput } from "./applicationDateSchema";
import { findNotStartedPhasesFromDates } from "../applicationPhase/queries/findNotStartedPhasesFromDates";
import { updatePhaseStatus } from "../applicationPhase";
import { createPhaseStartDate } from "./createPhaseStartDate";

export async function startPhaseOnDateUpdate(
  input: SetApplicationDatesInput,
  tx: PrismaTransactionClient
): Promise<ApplicationDateInput[]> {
  const phasesToStart = [];

  // find all the not-started phases on the application corresponding to the dates included in the input
  const applicationPhaseQueryResults = await findNotStartedPhasesFromDates(input, tx);

  // flatten for easier lookup
  const applicationPhases = applicationPhaseQueryResults.flatMap((applicationPhase) =>
    applicationPhase.phase.phase.phaseDateTypes.map((phaseDateType) => ({
      phaseId: applicationPhase.phaseId,
      dateTypeId: phaseDateType.dateTypeId,
    }))
  );

  // find the first phase for each date in the input to start
  for (const date of input.applicationDates) {
    const phase = applicationPhases.find((result) => result.dateTypeId === date.dateType);
    if (phase) {
      phasesToStart.push(phase);
    }
  }

  const startDatesToAdd: ApplicationDateInput[] = [];
  for (const phase of phasesToStart) {
    // casting enforced by database
    const phaseId = phase.phaseId as PhaseNameWithTrackedStatus;

    await updatePhaseStatus(input.applicationId, phaseId, "Started", tx);

    // push to the dates to add the phase start date
    const startDate = createPhaseStartDate(phaseId);
    if (startDate) {
      startDatesToAdd.push(startDate);
    }
  }
  return startDatesToAdd;
}

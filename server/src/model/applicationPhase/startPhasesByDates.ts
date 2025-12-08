import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus } from "../../types";
import { ApplicationDateInput } from "../applicationDate/applicationDateSchema";
import { startPhase } from ".";
import { createPhaseStartDate } from "../applicationDate/createPhaseStartDate";
import { EasternNow } from "../../dateUtilities";
import { getOrderedPhaseDateTypes } from "../phaseDateType/queries/getOrderedPhaseDateTypes";

export async function startPhasesByDates(
  tx: PrismaTransactionClient,
  applicationId: string,
  applicationDates: ApplicationDateInput[],
  easternNow: EasternNow
): Promise<ApplicationDateInput[]> {
  if (applicationDates.length === 0) {
    return [];
  }
  const orderedPhaseDateTypes = await getOrderedPhaseDateTypes(tx);

  const startDatesToAdd: ApplicationDateInput[] = [];
  for (const date of applicationDates) {
    // null date values indicate removal of a date, thus should not start a phase
    if (date.dateValue === null) {
      continue;
    }

    // The ordering of the phaseDateTypes ensures the found phase is ealiest in number.
    const phase = orderedPhaseDateTypes.find(
      (phaseDateType) => phaseDateType.dateTypeId === date.dateType
    );
    if (!phase) {
      throw new Error(`No phase found for date type ${date.dateType} `);
    }

    // casting constrained by database
    const phaseId = phase.phaseId as PhaseNameWithTrackedStatus;
    const phaseStarted = await startPhase(applicationId, phaseId, tx);
    if (phaseStarted) {
      const startDateForPhase = createPhaseStartDate(phaseId, easternNow);

      // add the start date if it's not already included in the input dates
      if (startDateForPhase && startDateForPhase.dateType !== date.dateType) {
        startDatesToAdd.push(startDateForPhase);
      }
    }
  }
  return startDatesToAdd;
}

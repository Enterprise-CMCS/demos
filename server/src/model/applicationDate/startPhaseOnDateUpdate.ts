import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseNameWithTrackedStatus } from "../../types";
import { ApplicationDateInput } from "./applicationDateSchema";
import { startPhase } from "../applicationPhase";
import { createPhaseStartDate } from "./createPhaseStartDate";
import { EasternNow } from "../../dateUtilities";
import { getOrderedPhaseDateTypes } from "../applicationPhase/queries/getOrderedPhaseDateTypes";

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

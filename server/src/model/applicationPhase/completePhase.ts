import { CompletePhaseInput } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getEasternNow } from "../../dateUtilities.js";
import {
  setPhaseToStarted,
  updatePhaseStatus,
  validatePhaseCompletion,
  PHASE_ACTIONS,
  updateStatusToUnderReviewIfNeeded,
  updateApplicationStatus,
} from ".";
import { validateAndUpdateDates } from "../applicationDate";

export async function completePhase(
  _: unknown,
  { input }: { input: CompletePhaseInput }
): Promise<PrismaApplication> {
  const phaseActions = PHASE_ACTIONS[input.phaseName];
  const easternNow = getEasternNow();

  if (phaseActions === "Not Permitted") {
    throw new Error(`Operations against the ${input.phaseName} phase are not permitted via API.`);
  }

  try {
    await prisma().$transaction(async (tx) => {
      // complete current phase
      await validatePhaseCompletion(input.applicationId, input.phaseName, tx);
      await validateAndUpdateDates(
        {
          applicationId: input.applicationId,
          applicationDates: [
            {
              dateType: phaseActions.dateToComplete,
              dateValue:
                easternNow[
                  DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.dateToComplete].expectedTimestamp
                ].easternTZDate,
            },
          ],
        },
        tx
      );
      await updatePhaseStatus(input.applicationId, input.phaseName, "Completed", tx);

      // start next phase, if applicable
      let nextPhaseWasStarted = false;
      if (phaseActions.nextPhase) {
        nextPhaseWasStarted = await setPhaseToStarted(
          input.applicationId,
          phaseActions.nextPhase.phaseName,
          tx
        );
        if (nextPhaseWasStarted && phaseActions.nextPhase.dateToStart) {
          await validateAndUpdateDates(
            {
              applicationId: input.applicationId,
              applicationDates: [
                {
                  dateType: phaseActions.nextPhase.dateToStart,
                  dateValue:
                    easternNow[
                      DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.nextPhase.dateToStart]
                        .expectedTimestamp
                    ].easternTZDate,
                },
              ],
            },
            tx
          );
        }
      }

      if (phaseActions.nextPhase?.phaseName === "Application Intake" && nextPhaseWasStarted) {
        await updateStatusToUnderReviewIfNeeded(input.applicationId, tx);
      }

      if (input.phaseName === "Approval Summary") {
        await updateApplicationStatus(input.applicationId, "Approved", tx);
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

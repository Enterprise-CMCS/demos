import { CompletePhaseInput, ApplicationDateInput } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getEasternNow } from "../../dateUtilities.js";
import { setPhaseToStarted, updatePhaseStatus, validatePhaseCompletion, PHASE_ACTIONS } from ".";
import { validateAndUpdateDates } from "../applicationDate";

export async function completePhase(
  _: unknown,
  { input }: { input: CompletePhaseInput }
): Promise<PrismaApplication> {
  const phaseActions = PHASE_ACTIONS[input.phaseName];
  const easternNow = getEasternNow();

  if (phaseActions === "Not Permitted") {
    throw new Error(`Operations against the ${input.phaseName} phase are not permitted via API.`);
  } else if (phaseActions === "Not Implemented") {
    throw new Error(`Completion of the ${input.phaseName} phase via API is not yet implemented.`);
  }

  try {
    await prisma().$transaction(async (tx) => {
      await validatePhaseCompletion(input.applicationId, input.phaseName, tx);
      await updatePhaseStatus(input.applicationId, input.phaseName, "Completed", tx);

      const applicationDatesToUpdate: ApplicationDateInput[] = [];
      applicationDatesToUpdate.push({
        dateType: phaseActions.dateToComplete,
        dateValue:
          easternNow[
            DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.dateToComplete].expectedTimestamp
          ].easternTZDate,
      });

      if (phaseActions.nextPhase) {
        const nextPhaseWasStarted = await setPhaseToStarted(
          input.applicationId,
          phaseActions.nextPhase.phaseName,
          tx
        );
        if (nextPhaseWasStarted) {
          if (phaseActions.nextPhase.dateToStart) {
            applicationDatesToUpdate.push({
              dateType: phaseActions.nextPhase.dateToStart,
              dateValue:
                easternNow[
                  DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.nextPhase.dateToStart]
                    .expectedTimestamp
                ].easternTZDate,
            });
          }
        }
      }

      await validateAndUpdateDates(
        { applicationId: input.applicationId, applicationDates: applicationDatesToUpdate },
        tx
      );
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

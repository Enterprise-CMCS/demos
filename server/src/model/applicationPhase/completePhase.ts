import { notifyApplicationStatusUpdated } from "../email/notifyApplicationEvent";
import { CompletePhaseInput } from "../../types.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { formatDateToPlainDate, getEasternNow } from "../../dateUtilities.js";
import {
  setPhaseToStarted,
  updatePhaseStatus,
  validatePhaseCompletion,
  PHASE_ACTIONS,
  PHASE_ACTION_TYPE_MAPPING,
} from ".";
import { validateAndUpdateDates } from "../applicationDate";
import { insertApplicationAction } from "../applicationAction/queries";
import { __DEMOS_VERSION__ } from "../../flags";

export async function completePhase(
  parent: unknown,
  { input }: { input: CompletePhaseInput },
  context: { user: { id: string } }
): Promise<PrismaApplication> {
  const phaseActions = PHASE_ACTIONS[input.phaseName];
  const easternNow = getEasternNow();

  if (phaseActions === "Not Permitted") {
    throw new Error(`Operations against the ${input.phaseName} phase are not permitted via API.`);
  }
  const phaseName = input.phaseName as Exclude<typeof input.phaseName, "Federal Comment">;

  const previousApplication = await getApplication(input.applicationId);

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
              plainDate: formatDateToPlainDate(easternNow["Current Time"].easternTZDate),
            },
          ],
        },
        tx,
        __DEMOS_VERSION__
      );
      await updatePhaseStatus(input.applicationId, input.phaseName, "Completed", tx);

      await insertApplicationAction(
        {
          applicationId: input.applicationId,
          actionType: PHASE_ACTION_TYPE_MAPPING[phaseName].complete,
          userId: context.user.id,
        },
        tx
      );

      // start next phase, if applicable
      let nextPhaseWasStarted = false;
      if (phaseActions.nextPhase) {
        nextPhaseWasStarted = await setPhaseToStarted(
          input.applicationId,
          phaseActions.nextPhase.phaseName,
          context.user.id,
          tx
        );

        if (nextPhaseWasStarted && phaseActions.nextPhase.dateToStart) {
          await validateAndUpdateDates(
            {
              applicationId: input.applicationId,
              applicationDates: [
                {
                  dateType: phaseActions.nextPhase.dateToStart,
                  plainDate: formatDateToPlainDate(easternNow["Current Time"].easternTZDate),
                },
              ],
            },
            tx,
            __DEMOS_VERSION__
          );
        }
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
  const application = await getApplication(input.applicationId);
  await notifyApplicationStatusUpdated(previousApplication, application, context.user.id);
  return application;
}

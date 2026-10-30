import { notifyApplicationStatusUpdated } from "../email/notifyApplicationEvent";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { formatDateToPlainDate } from "../../dateUtilities.js";
import {
  checkConceptPhaseStartedBeforeSkipping,
  getApplicationPhaseStatus,
  setPhaseToStarted,
  updatePhaseStatus,
} from ".";
import { validateAndUpdateDates } from "../applicationDate";
import { __DEMOS_VERSION__ } from "../../flags";

export async function skipConceptPhase(
  parent: unknown,
  { applicationId }: { applicationId: string },
  context: { user: { id: string } }
): Promise<PrismaApplication> {
  const easternToday = formatDateToPlainDate(new Date());

  const previousApplication = await getApplication(applicationId);

  try {
    await prisma().$transaction(async (tx) => {
      const conceptStatus = await getApplicationPhaseStatus(applicationId, "Concept", tx);
      checkConceptPhaseStartedBeforeSkipping(applicationId, conceptStatus);

      await validateAndUpdateDates(
        {
          applicationId: applicationId,
          applicationDates: [
            {
              dateType: "Concept Skipped Date",
              plainDate: easternToday,
            },
          ],
        },
        tx,
        __DEMOS_VERSION__
      );
      await updatePhaseStatus(applicationId, "Concept", "Skipped", tx);

      const nextPhaseWasStarted = await setPhaseToStarted(applicationId, "Application Intake", tx);
      if (nextPhaseWasStarted) {
        await validateAndUpdateDates(
          {
            applicationId: applicationId,
            applicationDates: [
              {
                dateType: "Application Intake Start Date",
                plainDate: easternToday,
              },
            ],
          },
          tx,
          __DEMOS_VERSION__
        );
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
  const application = await getApplication(applicationId);
  await notifyApplicationStatusUpdated(previousApplication, application, context.user.id);
  return application;
}

import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getEasternNow } from "../../dateUtilities.js";
import {
  checkConceptPhaseStartedBeforeSkipping,
  getApplicationPhaseStatus,
  setPhaseToStarted,
  updatePhaseStatus,
} from ".";
import { validateAndUpdateDates } from "../applicationDate";

export async function skipConceptPhase(
  _: unknown,
  { applicationId }: { applicationId: string }
): Promise<PrismaApplication> {
  const easternNow = getEasternNow();

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
              dateValue:
                easternNow[
                  DATE_TYPES_WITH_EXPECTED_TIMESTAMPS["Concept Skipped Date"].expectedTimestamp
                ].easternTZDate,
            },
          ],
        },
        tx
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
                dateValue:
                  easternNow[
                    DATE_TYPES_WITH_EXPECTED_TIMESTAMPS["Application Intake Start Date"]
                      .expectedTimestamp
                  ].easternTZDate,
              },
            ],
          },
          tx
        );
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(applicationId);
}

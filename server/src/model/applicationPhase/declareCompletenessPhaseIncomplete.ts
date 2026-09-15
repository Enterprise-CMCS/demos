import { notifyApplicationStatusUpdated } from "../email/notifyApplicationEvent";
import { ApplicationDateInput, DateType } from "../../types.js";
import { prisma } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkApplicationIntakeStatusForIncomplete,
  checkCompletenessStatusForIncomplete,
  getApplicationPhaseStatuses,
  updatePhaseStatus,
} from ".";
import { getApplicationDates, validateAndUpdateDates } from "../applicationDate";

export async function declareCompletenessPhaseIncomplete(
  parent: unknown,
  { applicationId }: { applicationId: string },
  context: { user: { id: string } }
): Promise<PrismaApplication> {
  const previousApplication = await getApplication(applicationId);

  try {
    await prisma().$transaction(async (tx) => {
      const existingApplicationDates = await getApplicationDates(applicationId, tx);
      const existingPhaseStatuses = await getApplicationPhaseStatuses(applicationId, tx);
      checkApplicationIntakeStatusForIncomplete(
        applicationId,
        existingPhaseStatuses["Application Intake"]
      );
      checkCompletenessStatusForIncomplete(applicationId, existingPhaseStatuses["Completeness"]);

      await updatePhaseStatus(applicationId, "Completeness", "Incomplete", tx);
      await updatePhaseStatus(applicationId, "Application Intake", "Started", tx);

      const datesToDelete = new Set<DateType>([
        "Completeness Start Date",
        "Completeness Completion Date",
        "State Application Submitted Date",
        "Completeness Review Due Date",
        "Application Intake Completion Date",
        "State Application Deemed Complete",
        "Federal Comment Period Start Date",
        "Federal Comment Period End Date",
      ]);

      const applicationDatesToDelete: ApplicationDateInput[] = [];
      for (const existingDate of existingApplicationDates) {
        if (datesToDelete.has(existingDate.dateType)) {
          applicationDatesToDelete.push({
            dateType: existingDate.dateType,
            dateValue: null,
          });
        }
      }

      await validateAndUpdateDates(
        {
          applicationId: applicationId,
          applicationDates: applicationDatesToDelete,
        },
        tx
      );
    });
  } catch (error) {
    handlePrismaError(error);
  }
  const application = await getApplication(applicationId);
  await notifyApplicationStatusUpdated(previousApplication, application, context.user.id);
  return application;
}

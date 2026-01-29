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
  _: unknown,
  { applicationId }: { applicationId: string }
): Promise<PrismaApplication> {
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

      const datesToDelete: DateType[] = [
        "Completeness Start Date",
        "Completeness Completion Date",
        "State Application Submitted Date",
        "Completeness Review Due Date",
        "Application Intake Completion Date",
        "State Application Deemed Complete",
        "Federal Comment Period Start Date",
        "Federal Comment Period End Date",
      ];

      const applicationDatesToDelete: ApplicationDateInput[] = [];
      for (const existingDate of existingApplicationDates) {
        if (datesToDelete.includes(existingDate.dateType)) {
          applicationDatesToDelete.push({
            dateType: existingDate.dateType,
            dateValue: null,
          });
        }
      }

      await validateAndUpdateDates(
        { applicationId: applicationId, applicationDates: applicationDatesToDelete },
        tx
      );
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(applicationId);
}

import { ApplicationType, ApplicationStatus } from "../../../types";
import { PrismaTransactionClient } from "../../../prismaClient";
import { getApplication } from "..";

/**
 * Updates the application status for a demonstration, amendment, or extension
 * @param applicationId - The ID of the application
 * @param status - The new status to set
 * @param tx - Prisma transaction client
 */
export async function updateApplicationStatus(
  applicationId: string,
  applicationStatus: ApplicationStatus,
  tx: PrismaTransactionClient
): Promise<void> {
  const application = await getApplication(applicationId);
  const applicationType = application.applicationTypeId as ApplicationType;

  switch (applicationType) {
    case "Demonstration":
      await tx.demonstration.update({
        where: { id: applicationId },
        data: { statusId: applicationStatus },
      });
      break;

    case "Amendment":
      await tx.amendment.update({
        where: { id: applicationId },
        data: { statusId: applicationStatus },
      });
      break;

    case "Extension":
      await tx.extension.update({
        where: { id: applicationId },
        data: { statusId: applicationStatus },
      });
      break;
  }
}

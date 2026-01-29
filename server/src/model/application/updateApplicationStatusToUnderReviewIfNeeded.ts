import { PrismaTransactionClient } from "../../prismaClient";
import { getApplication, updateApplicationStatus } from ".";

/**
 * Checks if the application status should be updated to "Under Review"
 * This should happen when transitioning from Concept to Application Intake phases
 * @param applicationId - The ID of the application
 * @param tx - Prisma transaction client
 * @returns Promise<boolean> - Whether the status was updated
 */
export async function updateApplicationStatusToUnderReviewIfNeeded(
  applicationId: string,
  tx: PrismaTransactionClient
): Promise<boolean> {
  const application = await getApplication(applicationId);
  const currentStatus = application.statusId;

  // Only update if the current status is "Pre-Submission"
  if (currentStatus === "Pre-Submission") {
    await updateApplicationStatus(applicationId, "Under Review", tx);
    return true;
  }

  return false;
}

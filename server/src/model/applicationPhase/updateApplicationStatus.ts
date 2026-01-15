import { ApplicationType, ApplicationStatus } from "../../types.js";
import { PrismaTransactionClient } from "../../prismaClient.js";

/**
 * Updates the application status for a demonstration, amendment, or extension
 * @param applicationId - The ID of the application
 * @param status - The new status to set
 * @param tx - Prisma transaction client
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  tx: PrismaTransactionClient
): Promise<void> {
  // First, get the application to determine its type
  const application = await tx.application.findUnique({
    where: { id: applicationId },
    select: { applicationTypeId: true }
  });

  if (!application) {
    throw new Error(`Application with id ${applicationId} not found`);
  }

  const applicationType = application.applicationTypeId as ApplicationType;

  // Update the appropriate table based on application type
  switch (applicationType) {
    case "Demonstration":
      await tx.demonstration.update({
        where: { id: applicationId },
        data: { statusId: status }
      });
      break;
    
    case "Amendment":
      await tx.amendment.update({
        where: { id: applicationId },
        data: { statusId: status }
      });
      break;
    
    case "Extension":
      await tx.extension.update({
        where: { id: applicationId },
        data: { statusId: status }
      });
      break;
    
    default:
      throw new Error(`Unknown application type: ${applicationType}`);
  }
}

/**
 * Checks if the application status should be updated to "Under Review"
 * This should happen when transitioning from Concept to Application Intake phases
 * @param applicationId - The ID of the application
 * @param tx - Prisma transaction client
 * @returns Promise<boolean> - Whether the status was updated
 */
export async function updateStatusToUnderReviewIfNeeded(
  applicationId: string,
  tx: PrismaTransactionClient
): Promise<boolean> {
  // First, get the current application status
  const application = await tx.application.findUnique({
    where: { id: applicationId },
    select: { 
      applicationTypeId: true,
      demonstration: { select: { statusId: true } },
      amendment: { select: { statusId: true } },
      extension: { select: { statusId: true } }
    }
  });

  if (!application) {
    throw new Error(`Application with id ${applicationId} not found`);
  }

  let currentStatus: ApplicationStatus | null = null;
  
  if (application.demonstration) {
    currentStatus = application.demonstration.statusId as ApplicationStatus;
  } else if (application.amendment) {
    currentStatus = application.amendment.statusId as ApplicationStatus;
  } else if (application.extension) {
    currentStatus = application.extension.statusId as ApplicationStatus;
  }

  // Only update if the current status is "Pre-Submission"
  if (currentStatus === "Pre-Submission") {
    await updateApplicationStatus(applicationId, "Under Review", tx);
    return true;
  }

  return false;
}

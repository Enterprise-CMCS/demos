import { PrismaTransactionClient } from "../../prismaClient";
import { ApplicationStatus, SetApplicationDatesInput } from "../../types";
import { getApplication } from "../application";

export async function validateAllowedDateChangeForApplication(
  tx: PrismaTransactionClient,
  input: SetApplicationDatesInput
): Promise<void> {
  const application = await getApplication(input.applicationId, { tx: tx });
  const applicationStatus = application.statusId as ApplicationStatus; // Enforced by DB
  const allowedApplicationStatuses: ApplicationStatus[] = [
    "Pre-Submission",
    "Under Review",
    "On-hold",
  ];
  if (!allowedApplicationStatuses.includes(applicationStatus)) {
    throw new Error(
      `Cannot modify dates on application ${input.applicationId} because it has status ` +
        `${applicationStatus}; applications must have one of these ` +
        `statuses to be editable: ${allowedApplicationStatuses.join(", ")}`
    );
  }
}

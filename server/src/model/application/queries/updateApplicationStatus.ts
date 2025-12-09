import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ApplicationStatus } from "../../../types.js";
import { getApplicationType } from "..";

export async function updateApplicationStatus(
  tx: PrismaTransactionClient,
  applicationId: string,
  applicationStatus: ApplicationStatus
): Promise<void> {
  const applicationType = await getApplicationType(tx, applicationId);

  if (applicationType === "Demonstration") {
    await tx.demonstration.update({
      where: {
        id: applicationId,
      },
      data: {
        statusId: applicationStatus,
      },
    });
  } else if (applicationType === "Amendment") {
    await tx.amendment.update({
      where: {
        id: applicationId,
      },
      data: {
        statusId: applicationStatus,
      },
    });
  } else {
    await tx.extension.update({
      where: {
        id: applicationId,
      },
      data: {
        statusId: applicationStatus,
      },
    });
  }
}

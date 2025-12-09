import { PrismaTransactionClient } from "../../../prismaClient.js";
import { ApplicationType } from "../../../types.js";

export async function getApplicationType(
  tx: PrismaTransactionClient,
  applicationId: string
): Promise<ApplicationType> {
  const application = await tx.application.findUniqueOrThrow({
    select: {
      applicationTypeId: true,
    },
    where: {
      id: applicationId,
    },
  });

  const applicationType = application.applicationTypeId as ApplicationType; // Guaranteed by database
  return applicationType;
}

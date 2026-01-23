import { PrismaTransactionClient } from "../../../prismaClient";

export async function deleteAllApplicationTags(
  applicationId: string,
  tx: PrismaTransactionClient
): Promise<void> {
  await tx.applicationTagAssignment.deleteMany({
    where: {
      applicationId: applicationId,
    },
  });
}

import { PrismaTransactionClient } from "../../../prismaClient";
import { Tag } from "../../../types";

export async function insertApplicationTags(
  applicationId: string,
  tags: Tag[],
  tx: PrismaTransactionClient
): Promise<void> {
  const payload = tags.map((tag) => ({
    applicationId: applicationId,
    tagId: tag,
    tagTypeId: "Application",
  }));
  await tx.applicationTagAssignment.createMany({
    data: payload,
  });
}

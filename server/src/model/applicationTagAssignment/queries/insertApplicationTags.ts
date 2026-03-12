import { PrismaTransactionClient } from "../../../prismaClient";
import { TagName } from "../../../types";

export async function insertApplicationTags(
  applicationId: string,
  tags: TagName[],
  tx: PrismaTransactionClient
): Promise<void> {
  const payload = tags.map((tag) => ({
    applicationId: applicationId,
    tagNameId: tag,
    tagTypeId: "Application",
  }));
  await tx.applicationTagAssignment.createMany({
    data: payload,
  });
}

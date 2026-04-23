import { PrismaTransactionClient } from "../../../prismaClient";
import { TagName } from "../../../types";

export async function createNewTagNameIfNotExists(
  newTagName: TagName,
  tx: PrismaTransactionClient
): Promise<void> {
  await tx.tagName.upsert({
    where: {
      id: newTagName,
    },
    update: {},
    create: {
      id: newTagName,
    },
  });
}

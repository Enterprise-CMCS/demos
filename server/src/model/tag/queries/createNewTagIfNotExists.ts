import { PrismaTransactionClient } from "../../../prismaClient";
import { Tag } from "../../../types";

export async function createNewTagIfNotExists(
  newTag: Tag,
  tx: PrismaTransactionClient
): Promise<void> {
  await tx.tag.upsert({
    where: {
      id: newTag,
    },
    update: {},
    create: {
      id: newTag,
    },
  });
}

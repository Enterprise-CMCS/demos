import { Tag as PrismaTag } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
export async function selectTags(
  tagName: string,
  tx: PrismaTransactionClient
): Promise<PrismaTag[]> {
  return tx.tag.findMany({
    where: {
      tagNameId: tagName,
    },
  });
}

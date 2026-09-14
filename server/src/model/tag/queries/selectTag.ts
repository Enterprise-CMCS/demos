import { Tag as PrismaTag } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { TagType } from "../../../types";
export async function selectTag(
  tagName: string,
  tagType: TagType,
  tx: PrismaTransactionClient
): Promise<PrismaTag | null> {
  return tx.tag.findUnique({
    where: {
      tagNameId_tagTypeId: {
        tagNameId: tagName,
        tagTypeId: tagType,
      },
    },
  });
}

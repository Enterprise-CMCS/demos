import { Tag as PrismaTag } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { TagName, TagSource, TagStatus, TagType } from "../../../types";

export async function insertTag(
  newTagName: TagName,
  newTagType: TagType,
  tx: PrismaTransactionClient
): Promise<PrismaTag> {
  const tagSource: TagSource = "User";
  const tagStatus: TagStatus = "Unapproved";
  return await tx.tag.create({
    data: {
      tagNameId: newTagName,
      tagTypeId: newTagType,
      sourceId: tagSource,
      statusId: tagStatus,
    },
  });
}

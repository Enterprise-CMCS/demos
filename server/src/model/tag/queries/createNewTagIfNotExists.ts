import { PrismaTransactionClient } from "../../../prismaClient";
import { TagName, TagSource, TagStatus, TagType } from "../../../types";

export async function createNewTagIfNotExists(
  newTagName: TagName,
  newTagType: TagType,
  tx: PrismaTransactionClient
): Promise<void> {
  const tagSource: TagSource = "User";
  const tagStatus: TagStatus = "Unapproved";
  await tx.tag.upsert({
    where: {
      tagNameId_tagTypeId: {
        tagNameId: newTagName,
        tagTypeId: newTagType,
      },
    },
    update: {},
    create: {
      tagNameId: newTagName,
      tagTypeId: newTagType,
      sourceId: tagSource,
      statusId: tagStatus,
    },
  });
}

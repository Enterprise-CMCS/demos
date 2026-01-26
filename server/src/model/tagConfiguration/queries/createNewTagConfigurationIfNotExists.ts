import { PrismaTransactionClient } from "../../../prismaClient";
import { Tag, TagConfigurationSource, TagConfigurationStatus, TagType } from "../../../types";

export async function createNewTagConfigurationIfNotExists(
  newTag: Tag,
  newTagType: TagType,
  tx: PrismaTransactionClient
): Promise<void> {
  const tagSource: TagConfigurationSource = "User";
  const tagStatus: TagConfigurationStatus = "Unreviewed";
  await tx.tagConfiguration.upsert({
    where: {
      tagId_tagTypeId: {
        tagId: newTag,
        tagTypeId: newTagType,
      },
    },
    update: {},
    create: {
      tagId: newTag,
      tagTypeId: newTagType,
      sourceId: tagSource,
      statusId: tagStatus,
    },
  });
}

import { Tag, TagStatus, TagType } from "../../types";
import { getTagsByTagType } from ".";

export async function getFormattedTagsByTagType(tagTypeId: TagType): Promise<Tag[]> {
  const result = await getTagsByTagType(tagTypeId);
  return result.map((tag) => ({
    tagName: tag.tagNameId,
    // casting enforced by database constraints
    approvalStatus: tag.statusId as TagStatus,
  }));
}

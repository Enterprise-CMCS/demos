import { TagStatus, TagType } from "../../types";
import { getTagByTagType, Tag } from ".";

export async function getTagListByTagType(tagTypeId: TagType): Promise<Tag[]> {
  const result = await getTagByTagType(tagTypeId);
  return result.map((tag) => ({
    tagName: tag.tagNameId,
    // casting enforced by database constraints
    approvalStatus: tag.statusId as TagStatus,
  }));
}

import { TagConfigurationStatus, TagType } from "../../types";
import { getTagConfigurationByTagType, TagConfiguration } from ".";

export async function getTagListByTagType(tagTypeId: TagType): Promise<TagConfiguration[]> {
  const result = await getTagConfigurationByTagType(tagTypeId);
  return result.map((tagConfiguration) => ({
    tagId: tagConfiguration.tagId,
    approvalStatus: tagConfiguration.statusId as TagConfigurationStatus,
  }));
}

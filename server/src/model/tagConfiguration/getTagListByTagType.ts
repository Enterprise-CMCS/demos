import { TagConfigurationStatus, TagType } from "../../types";
import { getTagConfigurationByTagType } from ".";
import { TagConfiguration } from "./tagConfigurationSchema";

export async function getTagListByTagType(tagTypeId: TagType): Promise<TagConfiguration[]> {
  const result = await getTagConfigurationByTagType(tagTypeId);
  return result.map((tagConfiguration) => ({
    tagId: tagConfiguration.tagId,
    approvalStatus: tagConfiguration.statusId as TagConfigurationStatus,
  }));
}

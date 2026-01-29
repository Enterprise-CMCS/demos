import { Tag, TagType } from "../../types";
import { getTagConfigurationByTagType } from ".";

export async function getTagListByTagType(tagTypeId: TagType): Promise<Tag[]> {
  const result = await getTagConfigurationByTagType(tagTypeId);
  return result.map((tagConfiguration) => tagConfiguration.tagId);
}

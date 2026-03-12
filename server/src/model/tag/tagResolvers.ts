import { getTagListByTagType, Tag } from ".";

export async function getDemonstrationTypes(): Promise<Tag[]> {
  return await getTagListByTagType("Demonstration Type");
}

export async function getApplicationTags(): Promise<Tag[]> {
  return await getTagListByTagType("Application");
}

export const tagResolvers = {
  Query: {
    demonstrationTypes: getDemonstrationTypes,
    applicationTags: getApplicationTags,
  },
};

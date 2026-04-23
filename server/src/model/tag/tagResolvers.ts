import { getFormattedTagsByTagType, Tag } from ".";

export async function getDemonstrationTypes(): Promise<Tag[]> {
  return await getFormattedTagsByTagType("Demonstration Type");
}

export async function getApplicationTags(): Promise<Tag[]> {
  return await getFormattedTagsByTagType("Application");
}

export const tagResolvers = {
  Query: {
    demonstrationTypeOptions: getDemonstrationTypes,
    applicationTagOptions: getApplicationTags,
  },
};

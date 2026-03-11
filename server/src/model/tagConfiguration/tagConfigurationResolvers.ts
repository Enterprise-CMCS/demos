import { getTagListByTagType, TagConfiguration } from ".";

export async function getDemonstrationTypes(): Promise<TagConfiguration[]> {
  return await getTagListByTagType("Demonstration Type");
}

export async function getApplicationTags(): Promise<TagConfiguration[]> {
  return await getTagListByTagType("Application");
}

export const tagConfigurationResolvers = {
  Query: {
    demonstrationTypes: getDemonstrationTypes,
    applicationTags: getApplicationTags,
  },
};

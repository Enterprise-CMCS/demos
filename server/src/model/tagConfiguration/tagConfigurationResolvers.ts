import { getTagListByTagType, TagConfiguration } from ".";

export async function getDemonstrationTypeNames(): Promise<TagConfiguration[]> {
  return await getTagListByTagType("Demonstration Type");
}

export async function getApplicationTags(): Promise<TagConfiguration[]> {
  return await getTagListByTagType("Application");
}

export const tagConfigurationResolvers = {
  Query: {
    demonstrationTypeNames: getDemonstrationTypeNames,
    applicationTags: getApplicationTags,
  },
};

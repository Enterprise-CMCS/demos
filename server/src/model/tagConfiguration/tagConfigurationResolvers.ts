import { Tag } from "../../types";
import { getTagListByTagType } from ".";

export async function getDemonstrationTypeNames(): Promise<Tag[]> {
  return await getTagListByTagType("Demonstration Type");
}

export async function getApplicationTags(): Promise<Tag[]> {
  return await getTagListByTagType("Application");
}

export const tagConfigurationResolvers = {
  Query: {
    demonstrationTypeNames: getDemonstrationTypeNames,
    applicationTags: getApplicationTags,
  },
};

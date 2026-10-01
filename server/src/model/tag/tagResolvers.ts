import {
  approveTags,
  createTags,
  getDemonstrationTypeSummaryCounts,
  getFormattedTagsByTagType,
} from ".";
import { __DEMOS_VERSION__ } from "../../flags";
import type { Tag, TagName, TagStatus } from "../../types";

export const tagResolvers = {
  Query: {
    demonstrationTypeOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Demonstration Type"),
    applicationTagOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Application"),
    demonstrationTypeUsageSummary: getDemonstrationTypeSummaryCounts,
  },

  Mutation: {
    createTags: async (parent: unknown, args: { tagNames: string[] }): Promise<Tag[]> => {
      const createdTags = await createTags(args.tagNames);
      return createdTags.map((demonstrationTypeTag) => ({
        tagName: demonstrationTypeTag.tagNameId,
        // casting enforced by database constraints
        approvalStatus: demonstrationTypeTag.statusId as TagStatus,
      }));
    },
    approveTags: async (parent: unknown, args: { tagNames: TagName[] }): Promise<Tag[]> => {
      return await approveTags(args.tagNames, __DEMOS_VERSION__);
    },
  },
};

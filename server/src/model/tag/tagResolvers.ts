import type { Tag, TagStatus } from "../../types";
import { getDemonstrationTypeSummaryCounts, getFormattedTagsByTagType, createTag } from ".";

export const tagResolvers = {
  Query: {
    demonstrationTypeOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Demonstration Type"),
    applicationTagOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Application"),
    demonstrationTypeUsageSummary: getDemonstrationTypeSummaryCounts,
  },

  Mutation: {
    createTag: async (parent: unknown, args: { tagName: string }): Promise<Tag> => {
      const demonstrationTypeTag = await createTag(args.tagName);
      return {
        tagName: demonstrationTypeTag.tagNameId,
        // casting enforced by database constraints
        approvalStatus: demonstrationTypeTag.statusId as TagStatus,
      };
    },
  },
};

import type { Tag, TagStatus } from "../../types";
import {
  getDemonstrationTypeSummaryCounts,
  getFormattedTagsByTagType,
  createTag,
  approveTag,
} from ".";
import { __DEMOS_VERSION__ } from "../../flags";

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
    approveTag: async (parent: unknown, args: { tagName: string }): Promise<Tag> => {
      return approveTag(args.tagName, __DEMOS_VERSION__);
    },
  },
};

import type { Tag } from "../../types";
import { getDemonstrationTypeSummaryCounts, getFormattedTagsByTagType, createTag } from ".";

export const tagResolvers = {
  Query: {
    demonstrationTypeOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Demonstration Type"),
    applicationTagOptions: (): Promise<Tag[]> => getFormattedTagsByTagType("Application"),
    demonstrationTypeUsageSummary: getDemonstrationTypeSummaryCounts,
  },

  Mutation: {
    createTag: (parent: unknown, args: { tagName: string }) => createTag(args.tagName),
  },
};

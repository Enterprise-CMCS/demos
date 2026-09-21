import type { Tag, TagName, TagStatus } from "../../types";
import { getDemonstrationTypeSummaryCounts, getFormattedTagsByTagType, createTag } from ".";

export const tagResolvers = {
  Mutation: {
    renameTag: async (
      parent: unknown,
      args: { oldName: string; newName: string }
    ): Promise<TagName> => renameTag(args.oldName, args.newName)  
    },
  },
};

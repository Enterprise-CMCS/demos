import type { TagName } from "../../types";
import { renameTag } from ".";

export const tagNameResolvers = {
  Mutation: {
    renameTag: async (
      parent: unknown,
      args: { oldName: string; newName: string }
    ): Promise<TagName> => {
      const newTagName = await renameTag(args.oldName, args.newName);
      return newTagName.id;
    },
  },
};

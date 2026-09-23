import type { Tag, TagName, TagStatus, TagType } from "../../types";
import {
  getDemonstrationTypeSummaryCounts,
  getFormattedTagsByTagType,
  createTag,
  selectTags,
  updateTags,
} from ".";
import { throwCustomGQLError } from "../../errors/errorCodes";

export const EDITABLE_TAG_TYPES: TagType[] = ["Demonstration Type", "Application"];

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
    approveTag: async (parent: unknown, args: { tagName: TagName }): Promise<Tag> => {
      // Find tags generally by tag name
      // Limited to only demo types and application for now; consistent with previous work
      const existingTags = await selectTags({
        tagNameId: args.tagName,
        tagTypeId: { in: EDITABLE_TAG_TYPES },
      });

      // Throw an error if a tag doesn't exist at all
      if (existingTags.length === 0) {
        throwCustomGQLError(
          `Attempted to approve tag ${args.tagName} but this tag does not exist.`,
          "TAG_DOES_NOT_EXIST_ERROR"
        );
      }

      // If none are unapproved, just return
      const unapprovedTags = existingTags.filter(
        (existingTag) => existingTag.statusId === ("Unapproved" satisfies TagStatus)
      );
      if (unapprovedTags.length === 0) {
        return {
          tagName: args.tagName,
          approvalStatus: "Approved",
        };
      }

      // Otherwise, update
      const updatedTags = await updateTags(
        {
          tagNameId: args.tagName,
          statusId: "Unapproved" satisfies TagStatus,
          tagTypeId: { in: EDITABLE_TAG_TYPES },
        },
        { statusId: "Approved" satisfies TagStatus }
      );
      return {
        tagName: updatedTags[0].tagNameId,
        approvalStatus: updatedTags[0].statusId as TagStatus, // Type is enforced by database
      };
    },
  },
};

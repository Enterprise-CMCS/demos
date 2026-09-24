import { getFeatureFlags, throwApiNotReleasedError } from "../../flags";
import type { Tag, TagName, TagStatus, TagType } from "../../types";
import { selectTags, updateTags } from ".";
import { throwCustomGQLError } from "../../errors/errorCodes";
export const EDITABLE_TAG_TYPES: TagType[] = ["Demonstration Type", "Application"];

export async function approveTag(tagName: TagName, currentVersion: string): Promise<Tag> {
  // Throw if not currently released
  if (!getFeatureFlags(currentVersion).approveTagApi) {
    throwApiNotReleasedError("approveTag");
  }

  // Find tags generally by tag name
  // Limited to only demo types and application for now; consistent with previous work
  const existingTags = await selectTags({
    tagNameId: tagName,
    tagTypeId: { in: EDITABLE_TAG_TYPES },
  });

  // Throw an error if a tag doesn't exist at all
  if (existingTags.length === 0) {
    throwCustomGQLError(
      `Attempted to approve tag ${tagName} but this tag does not exist.`,
      "TAG_DOES_NOT_EXIST_ERROR"
    );
  }

  // If none are unapproved, just return
  const unapprovedTags = existingTags.filter(
    (existingTag) => existingTag.statusId === ("Unapproved" satisfies TagStatus)
  );
  if (unapprovedTags.length === 0) {
    return {
      tagName: tagName,
      approvalStatus: "Approved",
    };
  }

  // Otherwise, update
  const updatedTags = await updateTags(
    {
      tagNameId: tagName,
      statusId: "Unapproved" satisfies TagStatus,
      tagTypeId: { in: EDITABLE_TAG_TYPES },
    },
    { statusId: "Approved" satisfies TagStatus }
  );
  return {
    tagName: updatedTags[0].tagNameId,
    approvalStatus: updatedTags[0].statusId as TagStatus, // Type is enforced by database
  };
}

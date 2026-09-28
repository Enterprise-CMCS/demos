import { SemVer } from "semver";
import { selectTags, updateTags } from ".";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { getFeatureFlags, throwApiNotReleasedError } from "../../flags";
import type { Tag, TagName, TagStatus, TagType } from "../../types";

export async function approveTag(tagName: TagName, currentVersion: SemVer): Promise<Tag> {
  // Throw if not currently released
  if (!getFeatureFlags(currentVersion).approveTagApi) {
    throwApiNotReleasedError("approveTag");
  }

  // Only demo type / application tags are approvable, consistent with previous work
  const approvableTagTypes: TagType[] = ["Demonstration Type", "Application"];

  // Find tags generally by tag name
  const existingTags = await selectTags({
    tagNameId: tagName,
    tagTypeId: { in: approvableTagTypes },
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
      tagTypeId: { in: approvableTagTypes },
    },
    { statusId: "Approved" satisfies TagStatus }
  );
  return {
    tagName: updatedTags[0].tagNameId,
    approvalStatus: updatedTags[0].statusId as TagStatus, // Type is enforced by database
  };
}

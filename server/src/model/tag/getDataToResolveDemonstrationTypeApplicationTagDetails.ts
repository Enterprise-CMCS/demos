import { SemVer } from "semver";
import { selectTags } from ".";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { getFeatureFlags, throwApiNotReleasedError } from "../../flags";
import type { Tag, TagName, TagStatus, TagType } from "../../types";

// Note: name of this function is a little weird intentionally
// Makes it clear that while this is basically returning a Tag, it has additional logic in it
// This is to avoid an overly generic function that might be reused in the wrong spot
export async function getDataToResolveDemonstrationTypeApplicationTagDetails(
  tagName: TagName,
  currentVersion: SemVer
): Promise<Tag> {
  if (!getFeatureFlags(currentVersion).tagDetailsApi) {
    throwApiNotReleasedError("tagDetails");
  }

  const selectedTags = await selectTags({
    tagNameId: tagName,
    tagTypeId: { in: ["Demonstration Type", "Application"] satisfies TagType[] },
  });

  if (selectedTags.length === 0) {
    throwCustomGQLError(
      `A tag with name '${tagName}' could not be found.`,
      "TAG_DOES_NOT_EXIST_ERROR"
    );
  }

  // Because it is possible for the demo type and app to have different statuses
  // Pick demo type preferentially; this is also what we did in the summary report
  const demonstrationTypeTag = selectedTags.find((tag) => tag.tagTypeId === "Demonstration Type");

  // Prefer the demo type tag; fall back to the application tag
  // Database enforces unique key on tag name, tag type, making this safe
  const selectedTag = demonstrationTypeTag ?? selectedTags[0];

  // Casts below enforced by database
  return {
    tagName: selectedTag.tagNameId,
    approvalStatus: selectedTag.statusId as TagStatus,
  };
}

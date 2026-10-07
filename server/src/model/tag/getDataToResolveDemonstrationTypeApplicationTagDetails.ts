import { SemVer } from "semver";
import { selectTags } from ".";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { getFeatureFlags, throwApiNotReleasedError } from "../../flags";
import type { Tag, TagName, TagStatus, TagType } from "../../types";
import type { Tag as PrismaTag } from "@prisma/client";

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
  const demonstrationTypeTag = selectedTags.filter((tag) => tag.tagTypeId === "Demonstration Type");
  const applicationTag = selectedTags.filter((tag) => tag.tagTypeId === "Application");

  let selectedTag: PrismaTag;
  if (demonstrationTypeTag.length > 0) {
    selectedTag = demonstrationTypeTag[0];
  } else {
    selectedTag = applicationTag[0];
  }

  // Casts below enforced by database
  return {
    tagName: selectedTag.tagNameId,
    approvalStatus: selectedTag.statusId as TagStatus,
  };
}

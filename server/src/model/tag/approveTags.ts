import { SemVer } from "semver";
import { selectTags, updateTags, checkTagNamesInExistingTags } from ".";
import { getFeatureFlags, throwApiNotReleasedError } from "../../flags";
import type { Tag, TagName, TagStatus, TagType } from "../../types";
import { prisma } from "../../prismaClient";

export async function approveTags(tagNames: TagName[], currentVersion: SemVer): Promise<Tag[]> {
  // Throw if not currently released
  if (!getFeatureFlags(currentVersion).approveTagsApi) {
    throwApiNotReleasedError("approveTags");
  }

  return await prisma().$transaction(async (tx) => {
    // Only demo type / application tags are approvable, consistent with previous work
    const approvableTagTypes: TagType[] = ["Demonstration Type", "Application"];

    // Dedupe inputs before query
    const inputTagNames = [...new Set(tagNames)];

    // Find tags generally by tag name
    const existingTags = await selectTags(
      {
        tagNameId: { in: inputTagNames },
        tagTypeId: { in: approvableTagTypes },
      },
      tx
    );

    checkTagNamesInExistingTags(tagNames, existingTags);

    // Identify which inputs are already approved or not approved
    // By this point, we know that all input tags exist in the query result, making this check safe
    const tagsAlreadyApproved = [];
    const tagsNeedingApproval = [];
    for (const inputTagName of inputTagNames) {
      if (
        !existingTags.some(
          (tag) =>
            tag.statusId === ("Unapproved" satisfies TagStatus) && tag.tagNameId === inputTagName
        )
      ) {
        tagsAlreadyApproved.push(inputTagName);
      } else {
        tagsNeedingApproval.push(inputTagName);
      }
    }

    // Run updates
    const updateTagsQueryResult = await updateTags(
      {
        tagNameId: { in: tagsNeedingApproval },
        statusId: "Unapproved" satisfies TagStatus,
        tagTypeId: { in: approvableTagTypes },
      },
      { statusId: "Approved" satisfies TagStatus },
      tx
    );
    const updatedTags = [
      ...new Set(updateTagsQueryResult.map((updatedTag) => updatedTag.tagNameId)),
    ];

    const finalResult: Tag[] = [];
    for (const alreadyApprovedTag of tagsAlreadyApproved) {
      finalResult.push({
        tagName: alreadyApprovedTag,
        approvalStatus: "Approved",
      });
    }
    for (const updatedTag of updatedTags) {
      finalResult.push({
        tagName: updatedTag,
        approvalStatus: "Approved",
      });
    }
    return finalResult;
  });
}

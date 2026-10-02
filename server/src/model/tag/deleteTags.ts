import { SemVer } from "semver";
import {
  checkDemonstrationTypeTagsCanBeDeleted,
  checkTagNamesInExistingTags,
  deleteTagRecords,
  getDemonstrationTypeSummaryCounts,
  selectTags,
} from ".";
import { getFeatureFlags, throwApiNotReleasedError } from "../../flags";
import { prisma } from "../../prismaClient";
import type { TagName, TagType } from "../../types";
import { deleteTagNames } from "../tagName";

export async function deleteTags(tagNames: TagName[], currentVersion: SemVer): Promise<number> {
  if (!getFeatureFlags(currentVersion).deleteTagsApi) {
    throwApiNotReleasedError("deleteTags");
  }

  return await prisma().$transaction(async (tx) => {
    const deletableTagTypes: TagType[] = ["Demonstration Type", "Application"];
    const inputTagNames = [...new Set(tagNames)];

    // Select first by filtering by the input tag names
    // This means every record in existing tags will have one of the input tag names
    const existingTags = await selectTags({ tagNameId: { in: inputTagNames } }, tx);

    // A tag name could be used for both a deletable and non-deletable tag, so need to obtain both lists of tags
    // The tag names of these two lists may overlap
    const existingTagsWithDeletableType = existingTags.filter((tag) =>
      deletableTagTypes.includes(tag.tagTypeId as TagType)
    );
    const existingTagsWithNonDeletableType = existingTags.filter(
      (tag) => !deletableTagTypes.includes(tag.tagTypeId as TagType)
    );

    // Verify that the input tag names are all present in the tags with deletable types
    // This checks that the query did not return zero rows for some of the input tag names
    checkTagNamesInExistingTags(inputTagNames, existingTagsWithDeletableType);

    // We now know that every input tag name is present in the list of tags with deletable types
    // Now, we check the usage to verify none of the input tags are in use
    const usageSummaries = await getDemonstrationTypeSummaryCounts();
    checkDemonstrationTypeTagsCanBeDeleted(
      usageSummaries.filter((summary) => inputTagNames.includes(summary.demonstrationTypeName))
    );

    // Get deduplicated lists of names to do database operations
    const existingTagNamesForDeletableTags = [
      ...new Set(existingTagsWithDeletableType.map((tag) => tag.tagNameId)),
    ];
    const existingTagNamesForNonDeletableTags = [
      ...new Set(existingTagsWithNonDeletableType.map((tag) => tag.tagNameId)),
    ];

    // Delete tags with the right names and types
    await deleteTagRecords(
      {
        tagNameId: { in: existingTagNamesForDeletableTags },
        tagTypeId: { in: deletableTagTypes },
      },
      tx
    );

    // Delete any tag names that were used only for deletable tags
    await deleteTagNames(
      {
        id: { in: existingTagNamesForDeletableTags },
        NOT: { id: { in: existingTagNamesForNonDeletableTags } },
      },
      tx
    );

    // Return count of rows deleted
    return inputTagNames.length;
  });
}

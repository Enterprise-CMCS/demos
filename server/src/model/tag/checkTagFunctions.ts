import type { Tag as PrismaTag } from "@prisma/client";
import { throwCustomGQLError } from "../../errors/errorCodes";
import type { DemonstrationTypeUsageSummary, TagName } from "../../types";

function makeUsageSummaryMessage(usageSummary: DemonstrationTypeUsageSummary): string {
  return (
    `The demonstration type '${usageSummary.demonstrationTypeName}' is used in the following places: ` +
    `${usageSummary.countOfTaggedApplications.demonstrations} demonstration applications, ` +
    `${usageSummary.countOfTaggedApplications.amendments} amendment applications, ` +
    `${usageSummary.countOfTaggedApplications.renewals} renewal applications, ` +
    `${usageSummary.countOfTaggedReferences} references, ` +
    `${usageSummary.countOfAssignedDemonstrations} demonstrations, and ` +
    `${usageSummary.countOfAssignedDeliverables} deliverables.`
  );
}

export function checkDemonstrationTypeTagsCanBeDeleted(
  usageSummaries: DemonstrationTypeUsageSummary[]
): void {
  const errorMessages = [];
  for (const usageSummary of usageSummaries) {
    const usageCount =
      Object.values(usageSummary.countOfTaggedApplications).reduce(
        (total, count) => total + count,
        0
      ) +
      usageSummary.countOfTaggedReferences +
      usageSummary.countOfAssignedDemonstrations +
      usageSummary.countOfAssignedDeliverables;
    if (usageCount > 0) {
      errorMessages.push(
        `Cannot delete '${usageSummary.demonstrationTypeName}'. ` +
          makeUsageSummaryMessage(usageSummary)
      );
    }
  }
  if (errorMessages.length > 0) {
    throwCustomGQLError(errorMessages.join(" "), "TAG_IN_USE_CANNOT_BE_DELETED_ERROR");
  }
}

export function checkTagNamesInExistingTags(tagNames: TagName[], existingTags: PrismaTag[]): void {
  const tagNamesToCheck = [...new Set(tagNames)];
  const existingTagNames = [...new Set(existingTags.map((tag) => tag.tagNameId))];
  const missingTagNames = tagNamesToCheck.filter(
    (inputTagName) => !existingTagNames.includes(inputTagName)
  );

  if (missingTagNames.length > 0) {
    throwCustomGQLError(
      `Attempted an operation on tags that do not exist: ${missingTagNames.join(", ")}.`,
      "TAG_DOES_NOT_EXIST_ERROR"
    );
  }
}

import type { DemonstrationTypeUsageSummary } from "../../types";
import { throwCustomGQLError } from "../../errors/errorCodes";

export function checkDemonstrationTypeTagCanBeDeleted(
  usageSummary: DemonstrationTypeUsageSummary
): void {
  const message =
    `The demonstration type ${usageSummary.demonstrationTypeName} is used in the following places: ` +
    `${usageSummary.countOfTaggedApplications.demonstrations} demonstration applications, ` +
    `${usageSummary.countOfTaggedApplications.amendments} amendment applications, ` +
    `${usageSummary.countOfTaggedApplications.renewals} renewal applications, ` +
    `${usageSummary.countOfTaggedReferences} references, ` +
    `${usageSummary.countOfAssignedDemonstrations} demonstrations, and ` +
    `${usageSummary.countOfAssignedDeliverables} deliverables.`;
  const usageCount =
    Object.values(usageSummary.countOfTaggedApplications).reduce(
      (total, count) => total + count,
      0
    ) +
    usageSummary.countOfTaggedReferences +
    usageSummary.countOfAssignedDemonstrations +
    usageSummary.countOfAssignedDeliverables;
  if (usageCount > 0) {
    throwCustomGQLError(
      `Cannot delete ${usageSummary.demonstrationTypeName}. ` + message,
      "TAG_IN_USE_CANNOT_BE_DELETED_ERROR"
    );
  }
}

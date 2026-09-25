import type { DemonstrationTypeUsageSummary } from "../../types";
import { throwCustomGQLError } from "../../errors/errorCodes";

export function checkDemonstrationTypeTagCanBeDeleted(
  usageSummary: DemonstrationTypeUsageSummary
): void {
  const usageCount =
    Object.values(usageSummary.countOfTaggedApplications).reduce(
      (total, count) => total + count,
      0
    ) +
    usageSummary.countOfAssignedDemonstrations +
    usageSummary.countOfAssignedDeliverables;
  if (usageCount > 0) {
    throwCustomGQLError(
      `Cannot delete ${usageSummary.demonstrationTypeName}; in use in ${usageCount} locations.`,
      "TAG_CANNOT_BE_DELETED_ERROR"
    );
  }
}

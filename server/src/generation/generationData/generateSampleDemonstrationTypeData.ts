import { addYears } from "date-fns";
import { tagResolvers } from "../../model/tag/tagResolvers";
import { DemonstrationTypeInput } from "../application/demonstration/applyDemonstrationTypes";

export const generateSampleDemonstrationTypeData = async ({
  effectiveDate,
  yearsActive,
  count = 1,
}: {
  effectiveDate: Date;
  yearsActive: number;
  count?: number;
}): Promise<DemonstrationTypeInput[]> => {
  // async concurrency issues causes issue with duplicate tag creation, so we'll just pull
  // from existing demonstration types instead of creating new ones for sample data
  const existingDemonstrationTypes = await tagResolvers.Query.demonstrationTypeOptions();
  return existingDemonstrationTypes
    .slice(0, Math.min(count, existingDemonstrationTypes.length))
    .map((demonstrationType) => ({
      name: demonstrationType.tagName,
      effectiveDate,
      expirationDate: addYears(effectiveDate, yearsActive),
    }));
};

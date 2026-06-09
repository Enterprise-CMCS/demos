import { demonstrationTypeTagAssignmentResolvers } from "../../../model/demonstrationTypeTagAssignment/demonstrationTypeTagAssignmentResolvers";
import { LocalDate, TagName } from "../../../types";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../../dateUtilities";

export type DemonstrationTypeInput = {
  name: TagName;
  effectiveDate: Date;
  expirationDate: Date;
};

export const applyDemonstrationTypes = async ({
  demonstrationId,
  demonstrationTypes,
}: {
  demonstrationId: string;
  demonstrationTypes: DemonstrationTypeInput[];
}) => {
  await demonstrationTypeTagAssignmentResolvers.Mutation.setDemonstrationTypes(null, {
    input: {
      demonstrationId,
      demonstrationTypes: demonstrationTypes.map((demonstrationType) => ({
        demonstrationTypeName: demonstrationType.name,
        demonstrationTypeDates: {
          effectiveDate: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(demonstrationType.effectiveDate)
          ) as LocalDate,
          expirationDate: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(demonstrationType.expirationDate)
          ) as LocalDate,
        },
      })),
    },
  });
};

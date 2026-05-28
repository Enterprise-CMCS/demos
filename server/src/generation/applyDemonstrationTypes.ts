import { TZDate } from "@date-fns/tz";
import { GraphQLContext } from "../auth";
import { demonstrationResolvers } from "../model/demonstration/demonstrationResolvers";
import { demonstrationTypeTagAssignmentResolvers } from "../model/demonstrationTypeTagAssignment/demonstrationTypeTagAssignmentResolvers";
import { LocalDate, TagName } from "../types";
import { addYears } from "date-fns";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../dateUtilities";
import { tagResolvers } from "../model/tag/tagResolvers";

export const applyDemonstrationTypes = async (
  demonstrationId: string,
  demonstrationTypeNames?: TagName[]
) => {
  if (!demonstrationTypeNames || demonstrationTypeNames.length === 0) {
    const typeOptions = await tagResolvers.Query.demonstrationTypeOptions();
    if (typeOptions.length === 0) {
      throw new Error("No demonstration types exist in the system to apply");
    }
    demonstrationTypeNames = [typeOptions[0].tagName];
  }
  const demonstration = await demonstrationResolvers.Query.demonstration(
    null,
    { id: demonstrationId },
    { user: { permissions: ["View All Demonstrations"] } } as GraphQLContext
  );
  const effectiveDate =
    demonstration.effectiveDate ??
    (formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(new TZDate())) as LocalDate);
  const expirationDate =
    demonstration.expirationDate ??
    (formatEasternTZDateToMMDDYYYY(
      parseJSDateToEasternTZDate(addYears(effectiveDate, 5))
    ) as LocalDate);

  await demonstrationTypeTagAssignmentResolvers.Mutation.setDemonstrationTypes(null, {
    input: {
      demonstrationId,
      demonstrationTypes: demonstrationTypeNames.map((name) => ({
        demonstrationTypeName: name,
        demonstrationTypeDates: {
          effectiveDate,
          expirationDate,
        },
      })),
    },
  });
};

import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../../dateUtilities";
import { demonstrationResolvers } from "../../../model/demonstration/demonstrationResolvers";
import { LocalDate } from "../../../types";

export const updateAdditionalDemonstrationData = async ({
  demonstrationId,
  effectiveDate,
  expirationDate,
}: {
  demonstrationId: string;
  effectiveDate?: Date;
  expirationDate?: Date;
}): Promise<void> => {
  await demonstrationResolvers.Mutation.updateDemonstration(null, {
    id: demonstrationId,
    input: {
      effectiveDate: effectiveDate
        ? (formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(effectiveDate)) as LocalDate)
        : null,
      expirationDate: expirationDate
        ? (formatEasternTZDateToMMDDYYYY(parseJSDateToEasternTZDate(expirationDate)) as LocalDate)
        : null,
    },
  });
};

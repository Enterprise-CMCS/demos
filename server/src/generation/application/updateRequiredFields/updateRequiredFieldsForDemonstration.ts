import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../../dateUtilities";
import { demonstrationResolvers } from "../../../model/demonstration/demonstrationResolvers";
import { LocalDate, SdgDivision } from "../../../types";

export type DemonstrationRequiredFields = {
  effectiveDate: Date;
  expirationDate: Date;
  sdgDivision: SdgDivision;
};

export const updateRequiredFieldsForDemonstrationApproval = async ({
  demonstrationId,
  requiredFields,
}: {
  demonstrationId: string;
  requiredFields: DemonstrationRequiredFields;
}): Promise<void> => {
  await demonstrationResolvers.Mutation.updateDemonstration(null, {
    id: demonstrationId,
    input: {
      effectiveDate: formatEasternTZDateToMMDDYYYY(
        parseJSDateToEasternTZDate(requiredFields.effectiveDate)
      ) as LocalDate,
      expirationDate: formatEasternTZDateToMMDDYYYY(
        parseJSDateToEasternTZDate(requiredFields.expirationDate)
      ) as LocalDate,
      sdgDivision: requiredFields.sdgDivision,
    },
  });
};

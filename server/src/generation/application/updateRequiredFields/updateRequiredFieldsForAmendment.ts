import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../../dateUtilities";
import { amendmentResolvers } from "../../../model/amendment/amendmentResolvers";
import { LocalDate, SignatureLevel } from "../../../types";

export type AmendmentRequiredFields = {
  effectiveDate: Date;
  signatureLevel: SignatureLevel;
};

export const updateRequiredFieldsForAmendmentApproval = async ({
  amendmentId,
  requiredFields,
}: {
  amendmentId: string;
  requiredFields: AmendmentRequiredFields;
}): Promise<void> => {
  await amendmentResolvers.Mutation.updateAmendment(null, {
    id: amendmentId,
    input: {
      effectiveDate: formatEasternTZDateToMMDDYYYY(
        parseJSDateToEasternTZDate(requiredFields.effectiveDate)
      ) as LocalDate,
      signatureLevel: requiredFields.signatureLevel,
    },
  });
};

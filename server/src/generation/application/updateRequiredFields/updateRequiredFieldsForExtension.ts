import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../../dateUtilities";
import { extensionResolvers } from "../../../model/extension/extensionResolvers";
import { LocalDate, SignatureLevel } from "../../../types";

export type ExtensionRequiredFields = {
  effectiveDate: Date;
  signatureLevel: SignatureLevel;
};

export const updateRequiredFieldsForExtensionApproval = async ({
  extensionId,
  requiredFields,
}: {
  extensionId: string;
  requiredFields: ExtensionRequiredFields;
}): Promise<void> => {
  await extensionResolvers.Mutation.updateExtension(null, {
    id: extensionId,
    input: {
      effectiveDate: formatEasternTZDateToMMDDYYYY(
        parseJSDateToEasternTZDate(requiredFields.effectiveDate)
      ) as LocalDate,
      signatureLevel: requiredFields.signatureLevel,
    },
  });
};

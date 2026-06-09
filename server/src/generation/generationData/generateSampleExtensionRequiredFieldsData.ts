import { ExtensionRequiredFields } from "../application/updateRequiredFields/updateRequiredFieldsForExtension";

export const generateSampleExtensionRequiredFieldsData = ({
  effectiveDate,
}: {
  effectiveDate: Date;
}): ExtensionRequiredFields => ({
  effectiveDate,
  signatureLevel: "OCD",
});

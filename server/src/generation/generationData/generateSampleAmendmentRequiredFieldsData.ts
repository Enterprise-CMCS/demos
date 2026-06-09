import { AmendmentRequiredFields } from "../application/updateRequiredFields/updateRequiredFieldsForAmendment";

export const generateSampleAmendmentRequiredFieldsData = ({
  effectiveDate,
}: {
  effectiveDate: Date;
}): AmendmentRequiredFields => ({
  effectiveDate,
  signatureLevel: "OCD",
});

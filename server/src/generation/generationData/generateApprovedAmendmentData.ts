import { generateSampleDateData } from "./generateSampleDateData";
import { generateSampleDocumentData } from "./generateSampleDocumentData";
import {} from "./generateSampleDemonstrationRequiredFieldsData";
import { GenerateApprovedAmendmentOnDemonstrationInput } from "../application/modification/generateApprovedAmendmentOnDemonstration";
import { generateSampleAmendmentRequiredFieldsData } from "./generateSampleAmendmentRequiredFieldsData";

export const generateApprovedAmendmentData = async ({
  name,
  demonstrationId,
  cmsUserId,
  approvalDate,
  effectiveDate,
}: {
  demonstrationId: string;
  name: string;
  cmsUserId: string;
  approvalDate: Date;
  effectiveDate: Date;
}): Promise<GenerateApprovedAmendmentOnDemonstrationInput> => ({
  name,
  description: `Amendment ${name} description`,
  requiredFields: generateSampleAmendmentRequiredFieldsData({
    effectiveDate,
  }),
  documents: generateSampleDocumentData(),
  dates: generateSampleDateData({ approvalDate }),
  documentOwnerUserId: cmsUserId,
  clearanceLevel: "CMS (OSORA)",
  demonstrationId,
});

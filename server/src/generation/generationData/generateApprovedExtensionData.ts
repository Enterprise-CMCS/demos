import { generateSampleDateData } from "./generateSampleDateData";
import { generateSampleDocumentData } from "./generateSampleDocumentData";
import {} from "./generateSampleDemonstrationRequiredFieldsData";
import { GenerateApprovedExtensionOnDemonstrationInput } from "../application/modification/generateApprovedExtensionOnDemonstration";
import { generateSampleExtensionRequiredFieldsData } from "./generateSampleExtensionRequiredFieldsData";

export const generateApprovedExtensionData = async ({
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
}): Promise<GenerateApprovedExtensionOnDemonstrationInput> => ({
  name,
  description: `Extension ${name} description`,
  requiredFields: generateSampleExtensionRequiredFieldsData({
    effectiveDate,
  }),
  documents: generateSampleDocumentData(),
  dates: generateSampleDateData({ approvalDate }),
  documentOwnerUserId: cmsUserId,
  clearanceLevel: "CMS (OSORA)",
  demonstrationId,
});

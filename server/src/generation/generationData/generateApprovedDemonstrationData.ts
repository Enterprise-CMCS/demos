import { State } from "../../types";
import { GenerateApprovedDemonstrationInput } from "../application/demonstration/generateApprovedDemonstration";
import { generateSampleDateData } from "./generateSampleDateData";
import { generateSampleDemonstrationTypeData } from "./generateSampleDemonstrationTypeData";
import { generateSampleDocumentData } from "./generateSampleDocumentData";
import { generateSampleDemonstrationRequiredFieldsData } from "./generateSampleDemonstrationRequiredFieldsData";

export const generateApprovedDemonstrationData = async ({
  name,
  stateId,
  cmsUserId,
  approvalDate,
  effectiveDate,
  yearsActive,
}: {
  name: string;
  stateId: State["id"];
  cmsUserId: string;
  approvalDate: Date;
  effectiveDate: Date;
  yearsActive: number;
}): Promise<GenerateApprovedDemonstrationInput> => ({
  name,
  description: `Demonstration ${name} description`,
  projectOfficerUserId: cmsUserId,
  requiredFields: generateSampleDemonstrationRequiredFieldsData({
    effectiveDate,
    yearsActive,
  }),
  demonstrationTypes: await generateSampleDemonstrationTypeData({
    effectiveDate,
    yearsActive,
  }),
  documents: generateSampleDocumentData(),
  dates: generateSampleDateData({ approvalDate }),
  documentOwnerUserId: cmsUserId,
  clearanceLevel: "CMS (OSORA)",
  stateId,
});

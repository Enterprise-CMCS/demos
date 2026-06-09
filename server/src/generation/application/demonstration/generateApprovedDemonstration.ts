import { updateRequiredFieldsForDemonstrationApproval } from "../updateRequiredFields/updateAdditionalDemonstrationData";
import { generateDemonstration } from "./generateDemonstration";
import { applyDemonstrationTypes, DemonstrationTypeInput } from "./applyDemonstrationTypes";
import { SdgDivision } from "../../../types";
import { Demonstration as PrismaDemonstration } from "@prisma/client";
import {
  progressApplicationThroughApproval,
  ProgressApplicationThroughApprovalInput,
} from "../progressApplicationThroughApproval";

export type GenerateApprovedDemonstrationInput = {
  name: string;
  description: string;
  projectOfficerUserId: string;
  stateId: string;
  requiredFields: {
    effectiveDate: Date;
    expirationDate: Date;
    sdgDivision: SdgDivision;
  };
  demonstrationTypes: DemonstrationTypeInput[];
} & Omit<ProgressApplicationThroughApprovalInput, "applicationId">;

export const generateApprovedDemonstration = async ({
  name,
  description,
  projectOfficerUserId,
  requiredFields,
  demonstrationTypes,
  documents,
  dates,
  documentOwnerUserId,
  clearanceLevel,
  stateId,
}: GenerateApprovedDemonstrationInput): Promise<PrismaDemonstration> => {
  const demonstration = await generateDemonstration({
    name,
    description,
    projectOfficerUserId,
    stateId,
  });
  await updateRequiredFieldsForDemonstrationApproval({
    demonstrationId: demonstration.id,
    requiredFields,
  });
  await applyDemonstrationTypes({
    demonstrationId: demonstration.id,
    demonstrationTypes,
  });
  await progressApplicationThroughApproval({
    applicationId: demonstration.id,
    documentOwnerUserId,
    dates,
    documents,
    clearanceLevel,
  });
  return demonstration;
};

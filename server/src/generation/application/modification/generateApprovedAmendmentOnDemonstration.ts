import { Amendment as PrismaAmendment } from "@prisma/client";
import { generateAmendmentOnDemonstration } from "./generateAmendmentOnDemonstration";
import {
  AmendmentRequiredFields,
  updateRequiredFieldsForAmendmentApproval,
} from "../updateRequiredFields/updateRequiredFieldsForAmendment";
import { DatesInput, DocumentsInput } from "../../types";
import { ClearanceLevel } from "../../../types";
import { progressApplicationThroughApproval } from "../progressApplicationThroughApproval";

export type GenerateApprovedAmendmentOnDemonstrationInput = {
  name: string;
  description: string;
  demonstrationId: string;
  requiredFields: AmendmentRequiredFields;
  dates: DatesInput;
  documents: DocumentsInput;
  documentOwnerUserId: string;
  clearanceLevel: ClearanceLevel;
};

export const generateApprovedAmendmentOnDemonstration = async ({
  name,
  description,
  demonstrationId,
  requiredFields,
  dates,
  documents,
  documentOwnerUserId,
  clearanceLevel,
}: GenerateApprovedAmendmentOnDemonstrationInput): Promise<PrismaAmendment> => {
  const amendment = await generateAmendmentOnDemonstration({
    name,
    description,
    demonstrationId,
  });
  await updateRequiredFieldsForAmendmentApproval({
    amendmentId: amendment.id,
    requiredFields,
  });
  await progressApplicationThroughApproval({
    applicationId: amendment.id,
    documentOwnerUserId,
    dates,
    documents,
    clearanceLevel,
  });
  return amendment;
};

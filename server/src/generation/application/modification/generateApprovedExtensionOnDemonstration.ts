import { Extension as PrismaExtension } from "@prisma/client";
import { generateExtensionOnDemonstration } from "./generateExtensionOnDemonstration";
import {
  ExtensionRequiredFields,
  updateRequiredFieldsForExtensionApproval,
} from "../updateRequiredFields/updateRequiredFieldsForExtension";
import { DatesInput, DocumentsInput } from "../../types";
import { ClearanceLevel } from "../../../types";
import { progressApplicationThroughApproval } from "../progressApplicationThroughApproval";

export type GenerateApprovedExtensionOnDemonstrationInput = {
  name: string;
  description: string;
  demonstrationId: string;
  requiredFields: ExtensionRequiredFields;
  dates: DatesInput;
  documents: DocumentsInput;
  documentOwnerUserId: string;
  clearanceLevel: ClearanceLevel;
};

export const generateApprovedExtensionOnDemonstration = async ({
  name,
  description,
  demonstrationId,
  requiredFields,
  dates,
  documents,
  documentOwnerUserId,
  clearanceLevel,
}: GenerateApprovedExtensionOnDemonstrationInput): Promise<PrismaExtension> => {
  const extension = await generateExtensionOnDemonstration({
    name,
    description,
    demonstrationId,
  });
  await updateRequiredFieldsForExtensionApproval({
    extensionId: extension.id,
    requiredFields,
  });
  await progressApplicationThroughApproval({
    applicationId: extension.id,
    documentOwnerUserId,
    dates,
    documents,
    clearanceLevel,
  });
  return extension;
};

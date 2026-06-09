import { DOCUMENT_TYPES } from "../../constants";
import { DocumentsInput } from "../types";

export const generateSampleDocumentData = () =>
  Object.fromEntries(
    DOCUMENT_TYPES.map((documentType) => [
      documentType,
      {
        name: `${documentType} Name`,
        description: `This is the ${documentType} description`,
        documentContentText: `This is sample content created for the ${documentType} document.`,
      },
    ])
  ) as DocumentsInput;

import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { DOCUMENT_TYPES } from "../../constants.js";

export const documentTypeResolvers = {
  DocumentType: generateCustomSetScalar(
    DOCUMENT_TYPES,
    "DocumentType",
    "A string representing a document type."
  ),
};

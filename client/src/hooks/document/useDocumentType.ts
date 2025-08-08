import { FetchResult, useLazyQuery } from "@apollo/client";
import { DocumentType } from "demos-server";
import { GET_ALL_DOCUMENT_TYPES } from "queries/document/documentTypeQueries";

export interface DocumentTypeOperations {
  getAllDocumentTypes: () => Promise<
    FetchResult<{ documentTypes: DocumentType[] }>
  >;
}

export const useDocumentType = (): DocumentTypeOperations => {
  const [getAllDocumentTypesTrigger] = useLazyQuery<{
    documentTypes: DocumentType[];
  }>(GET_ALL_DOCUMENT_TYPES);

  return {
    getAllDocumentTypes: getAllDocumentTypesTrigger,
  };
};

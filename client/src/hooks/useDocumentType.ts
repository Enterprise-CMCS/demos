import { useLazyQuery, ApolloError } from "@apollo/client";
import { DocumentType } from "demos-server";
import { GET_ALL_DOCUMENT_TYPES } from "queries/document/documentTypeQueries";

export type DocumentTypeOption = Pick<DocumentType, "name">;

interface GetDocumentTypeOptionsOperation {
  trigger: () => void;
  data?: DocumentTypeOption[];
  loading: boolean;
  error?: ApolloError;
}

export interface DocumentTypeOperations {
  getDocumentTypeOptions: GetDocumentTypeOptionsOperation;
}

const createGetDocumentTypeOptionsHook =
  (): GetDocumentTypeOptionsOperation => {
    const [trigger, { data, loading, error }] = useLazyQuery<{
      documentTypes: DocumentTypeOption[];
    }>(GET_ALL_DOCUMENT_TYPES);

    return {
      trigger,
      data: data?.documentTypes,
      loading,
      error,
    };
  };

export const useDocumentType = (): DocumentTypeOperations => {
  return {
    getDocumentTypeOptions: createGetDocumentTypeOptionsHook(),
  };
};

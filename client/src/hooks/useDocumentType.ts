import { useLazyQuery, ApolloError } from "@apollo/client";
import { DocumentType } from "demos-server";
import { DOCUMENT_TYPE_OPTIONS_QUERY } from "queries/documentTypeQueries";

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

const createGetDocumentTypeOptionsHook = (): GetDocumentTypeOptionsOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    documentTypes: DocumentTypeOption[];
  }>(DOCUMENT_TYPE_OPTIONS_QUERY);

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

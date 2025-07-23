import { useLazyQuery, ApolloError, gql } from "@apollo/client";
import { DocumentType } from "demos-server";

export const GET_ALL_DOCUMENT_TYPES_QUERY = gql`
  query GetAllDocumentTypes {
    documentTypes {
      name
    }
  }
`;

interface GetAllDocumentTypesOperation {
  trigger: () => void;
  data?: DocumentType[];
  loading: boolean;
  error?: ApolloError;
}

export interface DocumentTypeOperations {
  getAllDocumentTypes: GetAllDocumentTypesOperation;
}

const createGetAllDocumentTypesHook = (): GetAllDocumentTypesOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    documentTypes: DocumentType[];
  }>(GET_ALL_DOCUMENT_TYPES_QUERY);

  return {
    trigger,
    data: data?.documentTypes,
    loading,
    error,
  };
};

export const useDocumentType = (): DocumentTypeOperations => {
  return {
    getAllDocumentTypes: createGetAllDocumentTypesHook(),
  };
};

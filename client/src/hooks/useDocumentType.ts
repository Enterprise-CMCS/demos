import { useLazyQuery, ApolloError, gql } from "@apollo/client";

export const GET_ALL_DOCUMENT_TYPES_QUERY = gql`
  query GetAllDocumentTypes {
    documents {
      name
      description
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
    documents: Document[];
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

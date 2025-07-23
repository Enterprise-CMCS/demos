import { useLazyQuery, ApolloError, gql } from "@apollo/client";

export const GET_ALL_DOCUMENTS_QUERY = gql`
  query GetDocumentsForTable {
    documents {
      id
      title
      description
      type
      uploadedBy
      uploadDate
    }
  }
`;

interface GetAllDocumentsOperation {
  trigger: () => void;
  data?: Document[];
  loading: boolean;
  error?: ApolloError;
}

export interface DocumentOperations {
  getAllDocuments: GetAllDocumentsOperation;
}

const createGetAllDocumentsHook = (): GetAllDocumentsOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    documents: Document[];
  }>(GET_ALL_DOCUMENTS_QUERY);

  return {
    trigger,
    data: data?.documents,
    loading,
    error,
  };
};

export const useDocument = (): DocumentOperations => {
  return {
    getAllDocuments: createGetAllDocumentsHook(),
  };
};

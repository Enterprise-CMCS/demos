import { useLazyQuery, ApolloError } from "@apollo/client";
import { Dayjs } from "dayjs";
import { Document, User } from "demos-server";
import { DOCUMENT_TABLE_QUERY } from "queries/documentQueries";

export type DocumentTableRow = {
  id: Document["id"];
  title: Document["title"];
  description: Document["description"];
  documentType: Pick<Document["documentType"], "name">;
  uploadedBy: Pick<User, "fullName">;
  uploadDate: Dayjs;
};

interface GetDocumentTableOperation {
  trigger: () => void;
  data?: DocumentTableRow[];
  loading: boolean;
  error?: ApolloError;
}

export interface DocumentOperations {
  getDocumentTable: GetDocumentTableOperation;
}

const createGetDocumentTableHook = (): GetDocumentTableOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    documents: DocumentTableRow[];
  }>(DOCUMENT_TABLE_QUERY);

  return {
    trigger,
    data: data?.documents,
    loading,
    error,
  };
};

export const useDocument = (): DocumentOperations => {
  return {
    getDocumentTable: createGetDocumentTableHook(),
  };
};

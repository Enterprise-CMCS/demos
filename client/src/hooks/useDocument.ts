import { Document } from "demos-server";
import { DOCUMENT_TABLE_QUERY } from "queries/documentQueries";

import { ApolloError, useLazyQuery } from "@apollo/client";

export type DocumentTableRow = {
  id: Document["id"];
  title: Document["title"];
  description: Document["description"];
  documentType: Pick<Document["documentType"], "name">;
  owner: Pick<Document["owner"], "fullName">;
  createdAt: Pick<Document, "createdAt">;
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

import { useLazyQuery, useMutation, FetchResult } from "@apollo/client";
import {
  ADD_DEMONSTRATION_DOCUMENT_MUTATION,
  UPDATE_DEMONSTRATION_DOCUMENT_MUTATION,
  DELETE_DEMONSTRATION_DOCUMENT_MUTATION,
  GET_DOCUMENT_QUERY,
  GET_ALL_DOCUMENTS_QUERY,
} from "queries/document/documentQueries";
import {
  Document,
  CreateDemonstrationDocumentInput,
  UpdateDemonstrationDocumentInput,
} from "demos-server";

export interface DocumentOperations {
  createDemonstrationDocument: (
    input: CreateDemonstrationDocumentInput
  ) => Promise<FetchResult<{ addDemonstrationDocument?: Document }>>;
  updateDemonstrationDocument: (
    input: UpdateDemonstrationDocumentInput
  ) => Promise<FetchResult<{ updateDemonstrationDocument?: Document }>>;
  deleteDemonstrationDocument: (
    documentId: string
  ) => Promise<FetchResult<{ deleteDemonstrationDocument?: Document }>>;
  getDemonstrationDocument: (id: string) => Promise<FetchResult<{ document: Document }>>;
  getDemonstrationDocuments: (
    demonstrationId: string
  ) => Promise<FetchResult<{ documents: Document[] }>>;
}

export const useDocument = (): DocumentOperations => {
  const [createDemonstrationDocumentTrigger] = useMutation<{
    addDemonstrationDocument: Document;
  }>(ADD_DEMONSTRATION_DOCUMENT_MUTATION);
  const [updateDemonstrationDocumentTrigger] = useMutation<{
    updateDemonstrationDocument: Document;
  }>(UPDATE_DEMONSTRATION_DOCUMENT_MUTATION);
  const [deleteDemonstrationDocumentTrigger] = useMutation<{
    deleteDemonstrationDocument: Document;
  }>(DELETE_DEMONSTRATION_DOCUMENT_MUTATION);
  const [getDocumentTrigger] = useLazyQuery<{ document: Document }>(GET_DOCUMENT_QUERY);
  const [getDocumentsTrigger] = useLazyQuery<{ documents: Document[] }>(GET_ALL_DOCUMENTS_QUERY);

  return {
    createDemonstrationDocument: (input) =>
      createDemonstrationDocumentTrigger({ variables: { input } }),
    updateDemonstrationDocument: (input) =>
      updateDemonstrationDocumentTrigger({ variables: { input } }),
    deleteDemonstrationDocument: (documentId) =>
      deleteDemonstrationDocumentTrigger({ variables: { documentId } }),
    getDemonstrationDocument: (id) => getDocumentTrigger({ variables: { id } }),
    getDemonstrationDocuments: (demonstrationId) =>
      getDocumentsTrigger({ variables: { demonstrationId } }),
  };
};

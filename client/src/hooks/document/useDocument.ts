import { useLazyQuery, useMutation, FetchResult } from "@apollo/client";
import { ADD_DEMONSTRATION_DOCUMENT_MUTATION, UPDATE_DEMONSTRATION_DOCUMENT_MUTATION, DELETE_DEMONSTRATION_DOCUMENT_MUTATION, ADD_AMENDMENT_DOCUMENT_MUTATION, UPDATE_AMENDMENT_DOCUMENT_MUTATION, DELETE_AMENDMENT_DOCUMENT_MUTATION, GET_DOCUMENT_QUERY, GET_DOCUMENTS_QUERY } from "queries/documentQueries";
import { Document, AddDemonstrationDocumentInput, UpdateDemonstrationDocumentInput, BundleType } from "demos-server";

export interface DocumentOperations {
  addDemonstrationDocument: (input: AddDemonstrationDocumentInput) => Promise<FetchResult<{ addDemonstrationDocument?: Document }>>;
  updateDemonstrationDocument: (input: UpdateDemonstrationDocumentInput) => Promise<FetchResult<{ updateDemonstrationDocument?: Document }>>;
  deleteDemonstrationDocument: (documentId: string) => Promise<FetchResult<{ deleteDemonstrationDocument?: Document}>>;
  getDemonstrationDocument: (id: string) => Promise<FetchResult<{ document: Document }>>;
  getDemonstrationDocuments: (demonstrationId: string) => Promise<FetchResult<{ documents: Document[] }>>;
}

export const useDocument = (): DocumentOperations => {
  const [addDemonstrationDocumentTrigger] = useMutation<{ addDemonstrationDocument: Document }>(ADD_DEMONSTRATION_DOCUMENT_MUTATION);
  const [updateDemonstrationDocumentTrigger] = useMutation<{ updateDemonstrationDocument: Document }>(UPDATE_DEMONSTRATION_DOCUMENT_MUTATION);
  const [deleteDemonstrationDocumentTrigger] = useMutation<{ deleteDemonstrationDocument: Document }>(DELETE_DEMONSTRATION_DOCUMENT_MUTATION);
  const [getDocumentTrigger] = useLazyQuery<{ document: Document }>(GET_DOCUMENT_QUERY);
  const [getDocumentsTrigger] = useLazyQuery<{ documents: Document[] }>(GET_DOCUMENTS_QUERY);

  return {
    addDemonstrationDocument: (input) => addDemonstrationDocumentTrigger({ variables: { input } }),
    updateDemonstrationDocument: (input) => updateDemonstrationDocumentTrigger({ variables: { input } }),
    deleteDemonstrationDocument: (documentId) => deleteDemonstrationDocumentTrigger({ variables: { documentId } }),
    getDemonstrationDocument: (id) => getDocumentTrigger({ variables: { id } }),
    getDemonstrationDocuments: (demonstrationId) => getDocumentsTrigger({ variables: { demonstrationId } }),
  };
};

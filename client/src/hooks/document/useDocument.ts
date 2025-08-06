import { useLazyQuery, useMutation, FetchResult } from "@apollo/client";
import {
  CREATE_DEMONSTRATION_DOCUMENT_MUTATION,
  UPDATE_DEMONSTRATION_DOCUMENT_MUTATION,
  DELETE_DEMONSTRATION_DOCUMENTS_MUTATION,
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
  deleteDemonstrationDocuments: (
    documentIds: string[]
  ) => Promise<FetchResult<{ deleteDemonstrationDocuments?: string[] }>>;
  getDemonstrationDocument: (id: string) => Promise<FetchResult<{ document: Document }>>;
  getDemonstrationDocuments: (
    demonstrationId: string
  ) => Promise<FetchResult<{ documents: Document[] }>>;
}

export const useDocument = (): DocumentOperations => {
  const [createDemonstrationDocumentTrigger] = useMutation<{
    addDemonstrationDocument: Document;
  }>(CREATE_DEMONSTRATION_DOCUMENT_MUTATION);
  const [updateDemonstrationDocumentTrigger] = useMutation<{
    updateDemonstrationDocument: Document;
  }>(UPDATE_DEMONSTRATION_DOCUMENT_MUTATION);
  const [deleteDemonstrationDocumentsTrigger] = useMutation<{
    deleteDemonstrationDocument: string[];
  }>(DELETE_DEMONSTRATION_DOCUMENTS_MUTATION);
  const [getDocumentTrigger] = useLazyQuery<{ document: Document }>(GET_DOCUMENT_QUERY);
  const [getDocumentsTrigger] = useLazyQuery<{ documents: Document[] }>(GET_ALL_DOCUMENTS_QUERY);

  return {
    createDemonstrationDocument: (input) =>
      createDemonstrationDocumentTrigger({ variables: { input } }),
    updateDemonstrationDocument: (input) =>
      updateDemonstrationDocumentTrigger({ variables: { input } }),
    deleteDemonstrationDocuments: (documentIds: string[]) =>
      deleteDemonstrationDocumentsTrigger({ variables: { documentIds } }),
    getDemonstrationDocument: (id) => getDocumentTrigger({ variables: { id } }),
    getDemonstrationDocuments: (demonstrationId) =>
      getDocumentsTrigger({ variables: { demonstrationId } }),
  };
};

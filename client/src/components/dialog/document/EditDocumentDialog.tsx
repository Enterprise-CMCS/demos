import { gql, useMutation, DocumentNode } from "@apollo/client";
import React from "react";
import { Document, DocumentType, UpdateDocumentInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DocumentDialog, DocumentDialogFields, DocumentUploadResult } from "./DocumentDialog";

export const UPDATE_DOCUMENT_QUERY = gql`
  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      name
      description
      documentType
    }
  }
`;

export const EditDocumentDialog: React.FC<{
  onClose: () => void;
  initialDocument: DocumentDialogFields;
  canEditDocumentType?: boolean;
  hideDocumentType?: boolean;
  documentTypeSubset?: DocumentType[];
  refetchQueries?: DocumentNode[];
}> = ({
  onClose,
  initialDocument,
  canEditDocumentType = true,
  hideDocumentType = false,
  documentTypeSubset,
  refetchQueries = [DEMONSTRATION_DETAIL_QUERY],
}) => {
  const [updateDocumentTrigger] = useMutation<{ updateDocument: Document }>(UPDATE_DOCUMENT_QUERY);

  const handleEdit = async (dialogFields: DocumentDialogFields): Promise<DocumentUploadResult> => {
    const updateDocumentInput: UpdateDocumentInput = {
      name: dialogFields.name,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
    };

    await updateDocumentTrigger({
      variables: {
        id: dialogFields.id,
        input: updateDocumentInput,
      },
      refetchQueries,
    });

    return "succeeded";
  };

  return (
    <DocumentDialog
      mode="edit"
      initialDocument={initialDocument}
      onClose={onClose}
      onSubmit={handleEdit}
      canEditDocumentType={canEditDocumentType}
      hideDocumentType={hideDocumentType}
      documentTypeSubset={documentTypeSubset}
    />
  );
};

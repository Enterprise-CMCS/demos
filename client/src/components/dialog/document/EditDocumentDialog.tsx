import { gql, useMutation } from "@apollo/client";
import { DocumentDialogFields, DocumentUploadResult } from "./DocumentDialog";
import React from "react";
import { Document, UpdateDocumentInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DocumentDialog } from "./DocumentDialog";

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
}> = ({ onClose, initialDocument }) => {
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
      refetchQueries: [DEMONSTRATION_DETAIL_QUERY],
    });

    return "succeeded";
  };

  return (
    <DocumentDialog
      mode="edit"
      initialDocument={initialDocument}
      onClose={onClose}
      onSubmit={handleEdit}
    />
  );
};

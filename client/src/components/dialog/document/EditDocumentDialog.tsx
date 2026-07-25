import { gql, useMutation, DocumentNode, TypedDocumentNode } from "@apollo/client";
import React from "react";
import { Document as ServerDocument, UpdateDocumentInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DescriptionInput, TitleInput } from "./DocumentDialog";
import { BaseDialog } from "../BaseDialog";
import { UploadButton } from "./UploadButton";
import { useToast } from "components/toast";
import { useDialog } from "../DialogContext";
import { useValidation, ValidationSchema } from "hooks/useValidation";

type Document = Pick<ServerDocument, "id" | "name" | "description">;
const UPDATE_SUCCESS_MESSAGE = "Your document has been updated.";
const UPDATE_FAILURE_MESSAGE = "Your changes could not be saved because of an unknown problem.";

export const UPDATE_DOCUMENT_QUERY: TypedDocumentNode<
  { updateDocument: Document },
  { id: string; input: UpdateDocumentInput }
> = gql`
  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const hasChanges = (initialDocument: Document, activeDocument: Document): boolean => {
  return (
    activeDocument.name !== initialDocument.name ||
    activeDocument.description !== initialDocument.description
  );
};

const validation: ValidationSchema<Document> = {
  name: [(formData) => (formData.name.trim() ? undefined : "Document Title is required.")],
};

export const EditDocumentDialog: React.FC<{
  document: Document;
  refetchQueries?: DocumentNode[];
}> = ({ document, refetchQueries = [DEMONSTRATION_DETAIL_QUERY] }) => {
  const { closeDialog } = useDialog();
  const [activeDocument, setActiveDocument] = React.useState<Document>(document);
  const { showSuccess, showError } = useToast();

  const { isValid, errors } = useValidation(activeDocument, validation);
  const [updateDocument, { loading: saving }] = useMutation<{ updateDocument: Document }>(
    UPDATE_DOCUMENT_QUERY
  );

  const handleUpdate = async () => {
    try {
      await updateDocument({
        variables: {
          id: document.id,
          input: {
            name: activeDocument.name,
            description: activeDocument.description,
          },
        },
        refetchQueries,
      });
      showSuccess(UPDATE_SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Error updating document:", error);
      showError(UPDATE_FAILURE_MESSAGE);
    }
    closeDialog();
  };

  return (
    <>
      <BaseDialog
        title={"Edit Document"}
        onClose={closeDialog}
        dialogHasChanges={hasChanges(document, activeDocument)}
        actionButton={
          <UploadButton
            onClick={handleUpdate}
            disabled={!isValid || saving || !hasChanges(document, activeDocument)}
            isUploading={saving}
            label={"Save Changes"}
            loadingLabel={"Saving"}
          />
        }
        cancelButtonIsDisabled={saving}
      >
        <TitleInput
          value={activeDocument.name}
          onChange={(val) => {
            setActiveDocument((prev) => ({ ...prev, name: val }));
          }}
          validationMessage={errors.name}
        />

        <DescriptionInput
          value={activeDocument.description ?? ""}
          onChange={(val) => setActiveDocument((prev) => ({ ...prev, description: val }))}
        />
      </BaseDialog>
    </>
  );
};

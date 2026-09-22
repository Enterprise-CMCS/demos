import { gql, useMutation, DocumentNode, TypedDocumentNode } from "@apollo/client";
import React from "react";
import { Document as ServerDocument, UpdateDocumentInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DescriptionInput, TitleInput } from "./DocumentDialog";
import { BaseDialog } from "../BaseDialog";
import { UploadButton } from "./UploadButton";
import { useToast } from "components/toast";
import { useDialog } from "../DialogContext";

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

export const UPDATE_DELIVERABLE_CMS_DOCUMENT_QUERY: TypedDocumentNode<
  { updateDeliverableCmsDocument: Document },
  { id: string; input: UpdateDocumentInput }
> = gql`
  mutation UpdateDeliverableCmsDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDeliverableCmsDocument(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_DELIVERABLE_STATE_DOCUMENT_QUERY: TypedDocumentNode<
  { updateDeliverableStateDocument: Document },
  { id: string; input: UpdateDocumentInput }
> = gql`
  mutation UpdateDeliverableStateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDeliverableStateDocument(id: $id, input: $input) {
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

export const isValid = (document: Document): boolean => !!document.name.trim();

const EditDocumentDialogView: React.FC<{
  document: Document;
  saving: boolean;
  onSubmit: (input: UpdateDocumentInput) => Promise<unknown>;
}> = ({ document, saving, onSubmit }) => {
  const { closeDialog } = useDialog();
  const [activeDocument, setActiveDocument] = React.useState<Document>(document);
  const { showSuccess, showError } = useToast();

  const handleUpdate = async () => {
    try {
      await onSubmit({
        name: activeDocument.name,
        description: activeDocument.description,
      });
      showSuccess(UPDATE_SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Error updating document:", error);
      showError(UPDATE_FAILURE_MESSAGE);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title={"Edit Document"}
      onClose={closeDialog}
      dialogHasChanges={hasChanges(document, activeDocument)}
      actionButton={
        <UploadButton
          onClick={handleUpdate}
          disabled={!isValid(activeDocument) || saving || !hasChanges(document, activeDocument)}
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
      />

      <DescriptionInput
        value={activeDocument.description ?? ""}
        onChange={(val) => setActiveDocument((prev) => ({ ...prev, description: val }))}
      />
    </BaseDialog>
  );
};

export const EditApplicationDocumentDialog: React.FC<{
  document: Document;
  refetchQueries?: DocumentNode[];
}> = ({ document, refetchQueries = [DEMONSTRATION_DETAIL_QUERY] }) => {
  const [updateDocument, { loading }] = useMutation<{ updateDocument: Document }>(
    UPDATE_DOCUMENT_QUERY
  );

  return (
    <EditDocumentDialogView
      document={document}
      saving={loading}
      onSubmit={(input) =>
        updateDocument({ variables: { id: document.id, input }, refetchQueries })
      }
    />
  );
};

export const EditDeliverableCmsDocumentDialog: React.FC<{
  document: Document;
  refetchQueries?: DocumentNode[];
}> = ({ document, refetchQueries = [DEMONSTRATION_DETAIL_QUERY] }) => {
  const [updateDeliverableCmsDocument, { loading }] = useMutation<{
    updateDeliverableCmsDocument: Document;
  }>(UPDATE_DELIVERABLE_CMS_DOCUMENT_QUERY);

  return (
    <EditDocumentDialogView
      document={document}
      saving={loading}
      onSubmit={(input) =>
        updateDeliverableCmsDocument({ variables: { id: document.id, input }, refetchQueries })
      }
    />
  );
};

export const EditDeliverableStateDocumentDialog: React.FC<{
  document: Document;
  refetchQueries?: DocumentNode[];
}> = ({ document, refetchQueries = [DEMONSTRATION_DETAIL_QUERY] }) => {
  const [updateDeliverableStateDocument, { loading }] = useMutation<{
    updateDeliverableStateDocument: Document;
  }>(UPDATE_DELIVERABLE_STATE_DOCUMENT_QUERY);

  return (
    <EditDocumentDialogView
      document={document}
      saving={loading}
      onSubmit={(input) =>
        updateDeliverableStateDocument({ variables: { id: document.id, input }, refetchQueries })
      }
    />
  );
};

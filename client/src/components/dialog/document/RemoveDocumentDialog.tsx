import { gql, useMutation, DocumentNode } from "@apollo/client";
import { useToast } from "components/toast";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";
import React, { useState } from "react";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorButton } from "components/button";
import { ErrorIcon } from "components/icons";

export const DELETE_DOCUMENTS_QUERY = gql`
  mutation DeleteDocuments($ids: [ID!]!) {
    deleteDocuments(ids: $ids)
  }
`;

export const DELETE_DELIVERABLE_CMS_DOCUMENTS_QUERY = gql`
  mutation DeleteDeliverableCmsDocuments($ids: [ID!]!) {
    deleteDeliverableCmsDocuments(ids: $ids)
  }
`;

export const DELETE_DELIVERABLE_STATE_DOCUMENTS_QUERY = gql`
  mutation DeleteDeliverableStateDocuments($ids: [ID!]!) {
    deleteDeliverableStateDocuments(ids: $ids)
  }
`;

// Presentational dialog shared by every document shape; knows nothing about which mutation is used.
const RemoveDocumentDialogView: React.FC<{
  documentIds: string[];
  onClose: () => void;
  onConfirm: (documentIds: string[]) => Promise<unknown>;
}> = ({ documentIds, onClose, onConfirm: onConfirmMutation }) => {
  const { showSuccess, showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const onConfirm = async (documentIdList: string[]) => {
    try {
      setIsDeleting(true);
      await onConfirmMutation(documentIdList);

      const isMultipleDocuments = documentIdList.length > 1;
      const removalMessage = `Your document${isMultipleDocuments ? "s" : ""} ${
        isMultipleDocuments ? "have been" : "has been"
      } removed.`;
      showSuccess(removalMessage);
      onClose();
    } catch {
      showError("Your changes could not be saved due to an unknown problem.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseDialog
      title={`Remove Document${documentIds.length > 1 ? "s" : ""}`}
      onClose={onClose}
      dialogHasChanges={false}
      actionButton={
        <ErrorButton
          name="button-confirm-delete-document"
          size="small"
          onClick={() => onConfirm(documentIds)}
          aria-label="Confirm Remove Document"
          disabled={isDeleting}
          aria-disabled={isDeleting}
        >
          {isDeleting ? "Removing..." : "Remove"}
        </ErrorButton>
      }
    >
      <div className="mb-2 text-sm text-text-filled">
        Are you sure you want to remove {documentIds.length} document
        {documentIds.length > 1 ? "s" : ""}?
        <br />
        <span className="text-error flex items-center gap-1 mt-1">
          <ErrorIcon />
          This action cannot be undone!
        </span>
      </div>
    </BaseDialog>
  );
};

export const RemoveApplicationDocumentsDialog: React.FC<{
  documentIds: string[];
  onClose: () => void;
  refetchQueries?: DocumentNode[];
}> = ({
  documentIds,
  onClose,
  refetchQueries = [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY],
}) => {
  const [deleteDocumentsTrigger] = useMutation<{
    deleteDocuments: number;
  }>(DELETE_DOCUMENTS_QUERY);

  return (
    <RemoveDocumentDialogView
      documentIds={documentIds}
      onClose={onClose}
      onConfirm={(ids) => deleteDocumentsTrigger({ variables: { ids }, refetchQueries })}
    />
  );
};

export const RemoveDeliverableCmsDocumentsDialog: React.FC<{
  documentIds: string[];
  onClose: () => void;
  refetchQueries?: DocumentNode[];
}> = ({
  documentIds,
  onClose,
  refetchQueries = [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY],
}) => {
  const [deleteDeliverableCmsDocumentsTrigger] = useMutation<{
    deleteDeliverableCmsDocuments: number;
  }>(DELETE_DELIVERABLE_CMS_DOCUMENTS_QUERY);

  return (
    <RemoveDocumentDialogView
      documentIds={documentIds}
      onClose={onClose}
      onConfirm={(ids) =>
        deleteDeliverableCmsDocumentsTrigger({ variables: { ids }, refetchQueries })
      }
    />
  );
};

export const RemoveDeliverableStateDocumentsDialog: React.FC<{
  documentIds: string[];
  onClose: () => void;
  refetchQueries?: DocumentNode[];
}> = ({
  documentIds,
  onClose,
  refetchQueries = [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY],
}) => {
  const [deleteDeliverableStateDocumentsTrigger] = useMutation<{
    deleteDeliverableStateDocuments: number;
  }>(DELETE_DELIVERABLE_STATE_DOCUMENTS_QUERY);

  return (
    <RemoveDocumentDialogView
      documentIds={documentIds}
      onClose={onClose}
      onConfirm={(ids) =>
        deleteDeliverableStateDocumentsTrigger({ variables: { ids }, refetchQueries })
      }
    />
  );
};

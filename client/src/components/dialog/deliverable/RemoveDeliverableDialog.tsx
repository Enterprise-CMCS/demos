import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { ErrorButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { useToast } from "components/toast";

export const DELETE_DELIVERABLE_MUTATION = gql`
  mutation DeleteDeliverable($id: ID!) {
    deleteDeliverable(id: $id) {
      id
    }
  }
`;

export const REMOVE_DELIVERABLE_CONFIRM_MESSAGE =
  "Are you sure you want to remove this deliverable? This action cannot be undone!";
export const getRemoveDeliverableConfirmMessage = (deliverableCount: number): string =>
  deliverableCount === 1
    ? REMOVE_DELIVERABLE_CONFIRM_MESSAGE
    : `Are you sure you want to remove these ${deliverableCount} deliverables? This action cannot be undone!`;
export const DELIVERABLE_DELETED_MESSAGE =
  "Your deliverable has been deleted.";
export const DELIVERABLE_CANT_DELETE_HAS_FILES =
  "Cannot Delete -\nHas Files or Comments";
export const DELETE_DELIVERABLE_ERROR_MESSAGE =
  "Your changes could not be saved due to an unknown problem.";
const DELETE_DELIVERABLES_NAME =
  "button-confirm-delete-deliverable";

export const RemoveDeliverableDialog: React.FC<{
  deliverableIds: string[];
  onClose: () => void;
  onDeleted?: () => void;
}> = ({ deliverableIds, onClose, onDeleted }) => {
  const { showSuccess, showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const confirmMessage = getRemoveDeliverableConfirmMessage(deliverableIds.length);
  const [deleteDeliverable] = useMutation(DELETE_DELIVERABLE_MUTATION, {
    refetchQueries: ["GetDeliverablesPage"],
    awaitRefetchQueries: true,
  });

  const onConfirm = async () => {
    try {
      setIsDeleting(true);
      await Promise.all(
        deliverableIds.map((id) =>
          deleteDeliverable({
            variables: { id },
          })
        )
      );

      onDeleted?.();
      showSuccess(DELIVERABLE_DELETED_MESSAGE);
      onClose();
    } catch {
      showError(DELETE_DELIVERABLE_ERROR_MESSAGE);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseDialog
      title="Remove Deliverable"
      onClose={onClose}
      dialogHasChanges={false}
      actionButton={
        <ErrorButton
          name={DELETE_DELIVERABLES_NAME}
          size="small"
          onClick={onConfirm}
          aria-label="Confirm Remove Deliverable"
          disabled={isDeleting}
          aria-disabled={isDeleting}
        >
          {isDeleting ? "Removing..." : "Remove"}
        </ErrorButton>
      }
    >
      <div className="mb-2 text-sm text-text-filled">{confirmMessage}</div>
    </BaseDialog>
  );
};

import { useToast } from "components/toast";
import React, { useState } from "react";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorButton } from "components/button";
import { ErrorIcon } from "components/icons";

export const RemoveDocumentDialogView: React.FC<{
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

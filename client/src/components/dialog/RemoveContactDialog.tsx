import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { ErrorButton } from "components/button/ErrorButton";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon } from "components/icons";
import { useToast } from "components/toast";

export type RemoveContactDialogProps = {
  isOpen: boolean;
  contactIds: string[];
  onClose: () => void;
  onConfirm?: (contactIds: string[]) => Promise<void>;
};

export const RemoveContactDialog: React.FC<RemoveContactDialogProps> = ({
  isOpen,
  contactIds,
  onClose,
  onConfirm,
}) => {
  const { showSuccess, showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);

      if (onConfirm) {
        await onConfirm(contactIds);
      }

      const isMultipleContacts = contactIds.length > 1;
      showSuccess(`Your contact${isMultipleContacts ? "s have" : " has"} been removed.`);
      onClose();
    } catch (error) {
      console.error("Error in handleConfirm:", error);
      showError("Your changes could not be saved due to an unknown problem.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseDialog
      title={`Remove Contact${contactIds.length > 1 ? "s" : ""}`}
      isOpen={isOpen}
      onClose={onClose}
      actions={
        <>
          <SecondaryButton
            name="button-cancel-delete-contact"
            size="small"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </SecondaryButton>
          <ErrorButton
            name="button-confirm-delete-contact"
            size="small"
            onClick={handleConfirm}
            aria-label="Confirm Remove Contact"
            disabled={isDeleting}
            aria-disabled={isDeleting}
          >
            {isDeleting ? "Removing..." : "Remove"}
          </ErrorButton>
        </>
      }
    >
      <div className="mb-2 text-sm text-text-filled">
        Are you sure you want to remove {contactIds.length > 1 ? "the" : ""} contact
        {contactIds.length > 1 ? "s" : ""} ? This action cannot be undone!
        <br />
        <span className="text-error flex items-center gap-1 mt-1">
          <ErrorIcon />
          This action cannot be undone.
        </span>
      </div>
    </BaseDialog>
  );
};

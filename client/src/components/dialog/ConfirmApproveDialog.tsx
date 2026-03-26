import React, { useEffect, useRef } from "react";

import { Button, SecondaryButton } from "components/button";
import { tw } from "tags/tw";
import { WorkflowApplicationType } from "components/application";

interface ConfirmApproveDialogProps {
  onClose: () => void;
  onConfirm: () => void;
  applicationType: WorkflowApplicationType;
}

const STYLES = {
  CONFIRMATION_DIALOG: tw`bg-surface-white border border-border-rules rounded w-[600px] shadow-md text-center backdrop:bg-black/40`,
  CLOSE_BUTTON: tw`absolute top-xs right-sm text-[24px] text-text-placeholder hover:text-text-font cursor-pointer`,
  TITLE: tw`text-[18px] font-bold self-start p-1 pl-2 pt-2`,
  MESSAGE: tw`flex flex-col gap-1 border-y-1 border-border-rules p-2 items-start text-left`,
  BUTTONS: tw`flex self-end gap-md p-1`,
};

export const ConfirmApproveDialog: React.FC<ConfirmApproveDialogProps> = ({
  onClose,
  onConfirm,
  applicationType,
}) => {
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    confirmDialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = confirmDialogRef.current;
    if (dialog && e.target === dialog) {
      onClose();
    }
  };

  return (
    <dialog
      ref={confirmDialogRef}
      className={STYLES.CONFIRMATION_DIALOG}
      onClick={handleBackdropClick}
    >
      <div className="flex flex-col">
        <button data-testid="button-ca-dialog-close" onClick={onClose} className={STYLES.CLOSE_BUTTON} aria-label="Close dialog">
          ×
        </button>
        <h2 className={STYLES.TITLE}>ARE YOU SURE?</h2>
        <div className={STYLES.MESSAGE}>
          <span>Are you sure? By hitting accept you will be making the final submission of this approved {applicationType}. This will finalize the approval process and move the demonstration to the deliverables phase.</span>
        </div>
        <div className={STYLES.BUTTONS}>
          <SecondaryButton name="button-ca-dialog-cancel" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <Button name="button-ca-dialog-approve" onClick={onConfirm}>
            Submit Approved Demonstration
          </Button>
        </div>
      </div>
    </dialog>
  );
};

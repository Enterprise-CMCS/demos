import React, { useEffect, useRef } from "react";

import { ErrorButton } from "components/button";
import { SecondaryButton } from "components/button/SecondaryButton";
import { tw } from "tags/tw";

interface ConfirmCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CONFIRMATION_DIALOG = tw`bg-surface-white border border-border-rules rounded p-2 w-[400px] shadow-md text-center backdrop:bg-black/40`;

export const ConfirmCancellationDialog: React.FC<ConfirmCancellationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const confirmDialog = confirmDialogRef.current;
    if (!confirmDialog) return;

    if (isOpen) {
      confirmDialog.showModal();
    } else {
      confirmDialog.close();
    }
  }, [isOpen]);

  const handleConfirmDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Close confirmation dialog when clicking on backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={confirmDialogRef}
      className={CONFIRMATION_DIALOG}
      onClick={handleConfirmDialogClick}
    >
      <p className="text-sm font-bold mb-sm text-text-font">
        Are you sure you want to cancel? Changes you have made so far will not be saved.
      </p>
      <div className="flex justify-center gap-[24px]">
        <SecondaryButton name="cancel-no" size="small" onClick={onClose}>
          No
        </SecondaryButton>
        <ErrorButton name="cancel-yes" isOutlined={true} size="small" onClick={onConfirm}>
          Yes
        </ErrorButton>
      </div>
    </dialog>
  );
};

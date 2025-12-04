import React, { useEffect, useRef } from "react";

import { ErrorButton } from "components/button";
import { SecondaryButton } from "components/button/SecondaryButton";
import { tw } from "tags/tw";
import { AlertIcon } from "components/icons";

interface ConfirmCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const STYLES = {
  CONFIRMATION_DIALOG: tw`bg-surface-white border border-border-rules rounded w-[400px] shadow-md text-center backdrop:bg-black/40`,
  TITLE: tw`text-[18px] font-bold self-start p-1 pl-2 pt-2`,
  MESSAGE: tw`flex flex-col gap-1 border-y-1 border-border-rules p-2 items-start`,
  BUTTONS: tw`flex self-end gap-sm p-2`,
};

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

  return (
    <dialog ref={confirmDialogRef} className={STYLES.CONFIRMATION_DIALOG}>
      <div className="flex flex-col">
        <h2 className={STYLES.TITLE}>Are you sure?</h2>
        <div className={STYLES.MESSAGE}>
          <span>You will lose any unsaved changes in this view.</span>
          <span className="text-error flex items-center gap-0-5">
            <AlertIcon />
            This action cannot be undone!
          </span>
        </div>
        <div className={STYLES.BUTTONS}>
          <SecondaryButton name="cancel-no" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <ErrorButton name="cancel-yes" onClick={onConfirm}>
            Discard Changes
          </ErrorButton>
        </div>
      </div>
    </dialog>
  );
};

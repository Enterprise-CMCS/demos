import React, { useEffect, useRef, useState } from "react";

import { SecondaryButton } from "components/button";
import { tw } from "tags/tw";
import { ConfirmCancellationDialog } from "./ConfirmCancellationDialog";

export const DIALOG_CANCEL_BUTTON_NAME = "button-dialog-cancel";

interface BaseDialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  hasChanges?: boolean;
  maxWidthClass?: string;
  hideHeader?: boolean;
  cancelButtonIsDisabled?: boolean;
}

const DIALOG = tw`bg-surface-white text-text-font w-full rounded shadow-md p-md relative max-h-[85vh] overflow-y-auto space-y-sm backdrop:bg-black/40`;
const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font cursor-pointer`;
const TITLE = tw`text-[18px] font-semibold mb-xs`;
const HR = tw`border-border-rules my-sm`;

export const BaseDialog: React.FC<BaseDialogProps> = ({
  title,
  onClose,
  children,
  actionButton,
  hasChanges = true,
  maxWidthClass = "max-w-[720px]",
  hideHeader = false,
  cancelButtonIsDisabled = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isCancellationConfirmationOpen, setIsCancellationConfirmationOpen] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const dialog = dialogRef.current;
        if (dialog && dialog.open) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  const handleDialogClose = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const onCloseClicked = () => {
    if (hasChanges) {
      setIsCancellationConfirmationOpen(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <dialog ref={dialogRef} className={`${DIALOG} ${maxWidthClass}`} onClose={handleDialogClose}>
        {!hideHeader && (
          <>
            <button onClick={onCloseClicked} className={CLOSE_BUTTON} aria-label="Close dialog">
              ×
            </button>
            <h2 className={TITLE}>{title}</h2>
            <hr className={HR} />
          </>
        )}

        {children}

        {actionButton && (
          <>
            <hr className={HR} />
            <div className="flex justify-end gap-[24px]">
              <SecondaryButton
                name={DIALOG_CANCEL_BUTTON_NAME}
                onClick={onCloseClicked}
                disabled={cancelButtonIsDisabled}
              >
                Cancel
              </SecondaryButton>
              {actionButton}
            </div>
          </>
        )}
      </dialog>

      {isCancellationConfirmationOpen && (
        <ConfirmCancellationDialog
          isOpen={isCancellationConfirmationOpen}
          onClose={() => setIsCancellationConfirmationOpen(false)}
          onConfirm={onClose}
        />
      )}
    </>
  );
};

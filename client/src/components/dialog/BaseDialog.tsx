import React, { useEffect, useRef, useState } from "react";

import { SecondaryButton } from "components/button";
import { tw } from "tags/tw";
import { ConfirmCancellationDialog } from "./ConfirmCancellationDialog";

export const DIALOG_CANCEL_BUTTON_NAME = "button-dialog-cancel";

const DIALOG = tw`viewport-dialog bg-surface-white text-text-font w-full max-h-[calc(100dvh-2rem)] rounded shadow-md p-md relative flex flex-col space-y-sm overflow-hidden backdrop:bg-black/40`;
const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font cursor-pointer`;
const CLOSE_BUTTON_DISABLED = tw`absolute top-xs right-sm text-[22px] text-text-placeholder/50 cursor-not-allowed`;
const TITLE = tw`text-[18px] font-bold mb-xs shrink-0`;
const HR = tw`border-border-rules my-sm shrink-0`;

export const BaseDialog = ({
  name,
  title,
  onClose,
  children,
  actionButton,
  dialogHasChanges: hasChanges = true,
  maxWidthClass = "max-w-[720px]",
  hideHeader = false,
  cancelButtonIsDisabled = false,
}: {
  name?: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  dialogHasChanges?: boolean;
  maxWidthClass?: string;
  hideHeader?: boolean;
  cancelButtonIsDisabled?: boolean;
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
      <dialog
        ref={dialogRef}
        className={`${DIALOG} ${maxWidthClass}`}
        onClose={handleDialogClose}
        data-testid={name}
      >
        {!hideHeader && (
          <>
            <button
              data-testid="button-dialog-close"
              type="button"
              onClick={onCloseClicked}
              disabled={cancelButtonIsDisabled}
              className={cancelButtonIsDisabled ? CLOSE_BUTTON_DISABLED : CLOSE_BUTTON}
              aria-label="Close dialog"
            >
              ×
            </button>
            <h2 className={TITLE}>{title}</h2>
            <hr className={HR} aria-hidden="true" />
          </>
        )}
        <div className="min-h-0 overflow-y-auto space-y-sm">{children}</div>

        {actionButton && (
          <>
            <hr className={HR} aria-hidden="true" />
            <div className="flex shrink-0 flex-wrap justify-end gap-[24px]">
              <SecondaryButton
                name={DIALOG_CANCEL_BUTTON_NAME}
                onClick={onCloseClicked}
                disabled={cancelButtonIsDisabled}
                aria-label="Cancel and close dialog"
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

import React, { useEffect, useRef, useState } from "react";

import { SecondaryButton } from "components/button";
import { tw } from "tags/tw";
import { ConfirmCancellationDialog } from "./ConfirmCancellationDialog";

export const DIALOG_CANCEL_BUTTON_NAME = "button-dialog-cancel";

const DIALOG = tw`bg-surface-white text-text-font w-full rounded shadow-md p-md relative flex flex-col space-y-sm backdrop:bg-black/40`;
const DEFAULT_DIALOG_OVERFLOW = tw`overflow-visible`;
const VIEWPORT_DIALOG = tw`viewport-dialog max-h-[calc(100dvh-2rem)] overflow-hidden`;
const SCROLLABLE_CONTENT = tw`min-h-0 overflow-y-auto space-y-sm`;
const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font cursor-pointer`;
const CLOSE_BUTTON_DISABLED = tw`absolute top-xs right-sm text-[22px] text-text-placeholder/50 cursor-not-allowed`;
const TITLE = tw`text-[18px] font-bold mb-xs`;
const HR = tw`border-border-rules my-sm`;

export const BaseDialog = ({
  name,
  title,
  onClose,
  children,
  actionButton,
  dialogHasChanges = true,
  maxWidthClass = "max-w-[720px]",
  isPrimaryActionPending = false,
  isContentScrollable = false,
}: {
  name: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actionButton: React.ReactNode;
  dialogHasChanges?: boolean;
  maxWidthClass?: string;
  isPrimaryActionPending?: boolean;
  isContentScrollable?: boolean;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isCancellationConfirmationOpen, setIsCancellationConfirmationOpen] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus is on an option while a Select list is open; let the browser close just the list.
      if (event.target instanceof HTMLOptionElement) {
        return;
      }

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
    if (dialogHasChanges) {
      setIsCancellationConfirmationOpen(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        className={`${DIALOG} ${
          isContentScrollable ? VIEWPORT_DIALOG : DEFAULT_DIALOG_OVERFLOW
        } ${maxWidthClass}`}
        onClose={handleDialogClose}
        data-testid={name}
      >
        <>
          <button
            data-testid="button-dialog-close"
            type="button"
            onClick={onCloseClicked}
            disabled={isPrimaryActionPending}
            className={isPrimaryActionPending ? CLOSE_BUTTON_DISABLED : CLOSE_BUTTON}
            aria-label="Close dialog"
          >
            ×
          </button>
          <h2 className={`${TITLE} ${isContentScrollable ? "shrink-0" : ""}`}>{title}</h2>
          <hr className={`${HR} ${isContentScrollable ? "shrink-0" : ""}`} aria-hidden="true" />
        </>
        {isContentScrollable ? <div className={SCROLLABLE_CONTENT}>{children}</div> : children}
        {actionButton && (
          <>
            <hr className={`${HR} ${isContentScrollable ? "shrink-0" : ""}`} aria-hidden="true" />
            <div
              className={`flex justify-end gap-[24px] ${
                isContentScrollable ? "shrink-0 flex-wrap" : ""
              }`}
            >
              <SecondaryButton
                name={DIALOG_CANCEL_BUTTON_NAME}
                onClick={onCloseClicked}
                disabled={isPrimaryActionPending}
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

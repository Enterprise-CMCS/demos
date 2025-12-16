import React, { useEffect, useRef } from "react";

import { tw } from "tags/tw";
import { ConfirmCancellationDialog } from "./ConfirmCancellationDialog";
import { SecondaryButton } from "components/button";
import { useDialog } from "./DialogContext";

interface BaseDialogProps {
  title: string;
  children: React.ReactNode;
  submitButton?: React.ReactNode;
  maxWidthClass?: string;
  hideHeader?: boolean;
}

const DIALOG = tw`bg-surface-white text-text-font w-full rounded shadow-md p-md relative max-h-[85vh] overflow-y-auto space-y-sm backdrop:bg-black/40`;
const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font cursor-pointer`;
const TITLE = tw`text-[18px] font-semibold mb-xs`;
const HR = tw`border-border-rules my-sm`;

export const BaseDialog: React.FC<BaseDialogProps> = ({
  title,
  children,
  submitButton,
  maxWidthClass = "max-w-[720px]",
  hideHeader = false,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = React.useState<boolean>(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { hideDialog } = useDialog();

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

  return (
    <>
      <dialog ref={dialogRef} className={`${DIALOG} ${maxWidthClass}`} onClose={handleDialogClose}>
        {!hideHeader && (
          <>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className={CLOSE_BUTTON}
              aria-label="Close dialog"
            >
              ×
            </button>
            <h2 className={TITLE}>{title}</h2>
            <hr className={HR} />
          </>
        )}

        {children}
        <hr className={HR} />
        <div className="flex justify-end gap-[24px]">
          <SecondaryButton
            name="button-cancel-demonstration-dialog"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          {submitButton && submitButton}
        </div>
      </dialog>

      {showCancelConfirm && setShowCancelConfirm && (
        <ConfirmCancellationDialog
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={hideDialog}
        />
      )}
    </>
  );
};

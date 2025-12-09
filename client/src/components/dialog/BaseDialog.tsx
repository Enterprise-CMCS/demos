import React, { useEffect, useRef } from "react";

import { tw } from "tags/tw";
import { ConfirmCancellationDialog } from "./ConfirmCancellationDialog";

interface BaseDialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showCancelConfirm?: boolean;
  setShowCancelConfirm?: (val: boolean) => void;
  maxWidthClass?: string;
  hideHeader?: boolean;
}

const DIALOG = tw`bg-surface-white text-text-font w-full rounded shadow-md p-md relative max-h-[85vh] overflow-y-auto space-y-sm backdrop:bg-black/40`;
const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font cursor-pointer`;
const TITLE = tw`text-[18px] font-semibold mb-xs`;
const HR = tw`border-border-rules my-sm`;

export const BaseDialog: React.FC<BaseDialogProps> = ({
  title,
  onClose,
  children,
  actions,
  showCancelConfirm = false,
  setShowCancelConfirm,
  maxWidthClass = "max-w-[720px]",
  hideHeader = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
    if (showCancelConfirm && setShowCancelConfirm) {
      setShowCancelConfirm(true);
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

        {actions && (
          <>
            <hr className={HR} />
            <div className="flex justify-end gap-[24px]">{actions}</div>
          </>
        )}
      </dialog>

      {showCancelConfirm && setShowCancelConfirm && (
        <ConfirmCancellationDialog
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={onClose}
        />
      )}
    </>
  );
};

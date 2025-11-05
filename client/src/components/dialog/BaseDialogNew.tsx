import React, { useEffect, useRef } from "react";

import { ErrorButton } from "components/button";
import { SecondaryButton } from "components/button/SecondaryButton";
import { tw } from "tags/tw";

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
const CONFIRMATION_DIALOG = tw`bg-surface-white border border-border-rules rounded p-2 w-[400px] shadow-md text-center backdrop:bg-black/40`;

export const BaseDialogNew: React.FC<BaseDialogProps> = ({
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
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  useEffect(() => {
    if (showCancelConfirm) {
      confirmDialogRef.current?.showModal();
    } else {
      confirmDialogRef.current?.close();
    }
  }, [showCancelConfirm]);

  const handleConfirmDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Close confirmation dialog when clicking on backdrop
    if (e.target === e.currentTarget && setShowCancelConfirm) {
      setShowCancelConfirm(false);
    }
  };

  return (
    <>
      <dialog ref={dialogRef} className={`${DIALOG} ${maxWidthClass}`} onClose={onClose}>
        {!hideHeader && (
          <>
            <button
              onClick={() => {
                if (setShowCancelConfirm) {
                  setShowCancelConfirm(true);
                } else {
                  onClose();
                }
              }}
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

        {actions && (
          <>
            <hr className={HR} />
            <div className="flex justify-end gap-[24px]">{actions}</div>
          </>
        )}
      </dialog>

      {showCancelConfirm && setShowCancelConfirm && (
        <dialog
          ref={confirmDialogRef}
          className={CONFIRMATION_DIALOG}
          onClick={handleConfirmDialogClick}
        >
          <p className="text-sm font-bold mb-sm text-text-font">
            Are you sure you want to cancel? Changes you have made so far will not be saved.
          </p>
          <div className="flex justify-center gap-[24px]">
            <SecondaryButton
              name="cancel-no"
              size="small"
              onClick={() => setShowCancelConfirm(false)}
            >
              No
            </SecondaryButton>
            <ErrorButton name="cancel-yes" isOutlined={true} size="small" onClick={onClose}>
              Yes
            </ErrorButton>
          </div>
        </dialog>
      )}
    </>
  );
};

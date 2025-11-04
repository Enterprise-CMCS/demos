import React, { useEffect, useRef, useState } from "react";
import { ErrorButton } from "components/button";
import { SecondaryButton } from "components/button/SecondaryButton";
import { Button } from "components/button";
import { tw } from "tags/tw";

interface BaseDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onSubmit?: () => Promise<void> | void;
}

const DIALOG = tw`bg-surface-white text-text-font w-full rounded shadow-md p-md relative max-h-[85vh] overflow-y-auto space-y-sm backdrop:bg-black/40`;
const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font cursor-pointer`;
const TITLE = tw`text-[18px] font-semibold mb-xs`;
const HR = tw`border-border-rules my-sm`;
const CONFIRMATION_DIALOG = tw`bg-surface-white border border-border-rules rounded p-2 w-[400px] shadow-md text-center backdrop:bg-black/40`;

const CancelConfirmDialog: React.FC<{
  open: boolean;
  onCancel: () => void;
  onAccept: () => void;
}> = ({ open, onCancel, onAccept }) => {
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const confirmDialog = confirmDialogRef.current;
    if (!confirmDialog) return;

    if (open) {
      confirmDialog.showModal();
    } else {
      confirmDialog.close();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return open ? (
    <dialog ref={confirmDialogRef} className={CONFIRMATION_DIALOG} onClick={handleBackdropClick}>
      <p className="text-sm font-bold mb-sm text-text-font">
        Are you sure you want to cancel? Changes you have made so far will not be saved.
      </p>
      <div className="flex justify-center gap-[24px]">
        <SecondaryButton name="cancel-no" size="small" onClick={onCancel}>
          No
        </SecondaryButton>
        <ErrorButton name="cancel-yes" isOutlined={true} size="small" onClick={onAccept}>
          Yes
        </ErrorButton>
      </div>
    </dialog>
  ) : null;
};

export const BaseDialog: React.FC<BaseDialogProps> = ({
  title,
  isOpen,
  onClose,
  children,
  onSubmit,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleCloseClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
  };

  const handleAcceptConfirm = () => {
    setShowCancelConfirm(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <dialog ref={dialogRef} className={DIALOG} onClose={onClose}>
        <button onClick={handleCloseClick} className={CLOSE_BUTTON} aria-label="Close dialog">
          ×
        </button>
        <h2 className={TITLE}>{title}</h2>
        <hr className={HR} />

        {children}

        <hr className={HR} />
        <div className="flex justify-end gap-[24px]">
          <SecondaryButton
            name="button-cancel-contact-dialog"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <Button
            name="button-submit-contact-dialog"
            size="small"
            type="button"
            form="contact-form"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </dialog>

      <CancelConfirmDialog
        open={showCancelConfirm}
        onCancel={handleCancelConfirm}
        onAccept={handleAcceptConfirm}
      />
    </>
  );
};
